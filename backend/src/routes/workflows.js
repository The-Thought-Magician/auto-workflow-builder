const express = require('express');
const authenticate = require('../middleware/authenticate');
const { EnhancedN8nUtils } = require('../utils/mcpClient');

const router = express.Router();

// Initialize enhanced n8n utilities
const n8nUtils = new EnhancedN8nUtils();

// List all workflows for the current user
router.get('/', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const workflows = await prisma.workflow.findMany({ where: { userId: req.user.id } });
    // Format workflows: include last run date and status (active/inactive)
    const formatted = workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      status: wf.status,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// Create a new workflow
router.post('/', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { name, description, configuration } = req.body;
    if (!name || !configuration) {
      return res.status(400).json({ message: 'Name and configuration are required' });
    }
    // Send workflow to n8n API for creation
    const n8nWorkflow = {
      name,
      active: false,
      nodes: configuration.nodes || [],
      connections: configuration.connections || {},
      settings: configuration.settings || {},
    };
    let created;
    try {
      created = await n8nUtils.createWorkflow(n8nWorkflow);
    } catch (err) {
      // If n8n API call fails, return an error
      return res.status(500).json({ message: `Failed to create workflow in n8n: ${err.message}` });
    }
    // Store in local database
    const wf = await prisma.workflow.create({
      data: {
        id: created?.id || undefined,
        name,
        description,
        configuration,
        status: created?.active ?? false,
        userId: req.user.id,
      },
    });
    res.status(201).json({ id: wf.id, name: wf.name, status: wf.status });
  } catch (err) {
    next(err);
  }
});

// Get a workflow by ID
router.get('/:id', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const wf = await prisma.workflow.findUnique({ where: { id, userId: req.user.id } });
    if (!wf) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    // Optionally fetch from n8n for latest status
    let remote;
    try {
      remote = await n8nUtils.getWorkflow(id);
    } catch (err) {
      // ignore; not fatal
    }
    res.json({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      configuration: wf.configuration,
      status: remote?.active ?? wf.status,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// Update workflow
router.put('/:id', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const { name, description, configuration, status } = req.body;
    const wf = await prisma.workflow.findUnique({ where: { id, userId: req.user.id } });
    if (!wf) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    // Prepare updated workflow for n8n
    const updatedWorkflow = {
      name: name ?? wf.name,
      active: typeof status === 'boolean' ? status : wf.status,
      nodes: configuration?.nodes ?? wf.configuration.nodes,
      connections: configuration?.connections ?? wf.configuration.connections,
      settings: configuration?.settings ?? wf.configuration.settings,
    };
    // Update in n8n
    try {
      await n8nUtils.updateWorkflow(id, updatedWorkflow);
    } catch (err) {
      return res.status(500).json({ message: `Failed to update workflow in n8n: ${err.message}` });
    }
    // Update in local DB
    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: updatedWorkflow.name,
        description: description ?? wf.description,
        configuration: configuration ?? wf.configuration,
        status: updatedWorkflow.active,
      },
    });
    res.json({ id: updated.id, name: updated.name, status: updated.status });
  } catch (err) {
    next(err);
  }
});

// Delete workflow
router.delete('/:id', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const wf = await prisma.workflow.findUnique({ where: { id, userId: req.user.id } });
    if (!wf) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    // Delete from n8n
    try {
      await n8nUtils.deleteWorkflow(id);
    } catch (err) {
      // continue even if deletion fails
    }
    // Delete locally
    await prisma.workflow.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Run workflow manually
router.post('/:id/run', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    // verify ownership
    const wf = await prisma.workflow.findFirst({ where: { id, userId: req.user.id } });
    if (!wf) return res.status(404).json({ message: 'Workflow not found' });
    const result = await n8nUtils.runWorkflow(id);
    // Persist execution log (basic)
    await prisma.executionLog.create({ data: { status: 'queued', data: result, workflowId: wf.id } });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get workflow run history
router.get('/:id/history', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    // Combine local execution logs with remote ones if available
    const localLogs = await prisma.executionLog.findMany({ where: { workflowId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
    let remote = [];
    try { remote = await n8nUtils.listExecutions(id); } catch (_) {}
    res.json({ local: localLogs, remote });
  } catch (err) { next(err); }
});

// Get detailed execution log (local)
router.get('/:id/history/:logId', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id, logId } = req.params;
    const wf = await prisma.workflow.findFirst({ where: { id, userId: req.user.id } });
    if (!wf) return res.status(404).json({ message: 'Workflow not found' });
    const log = await prisma.executionLog.findUnique({ where: { id: logId } });
    if (!log || log.workflowId !== wf.id) return res.status(404).json({ message: 'Execution log not found' });
    res.json(log);
  } catch (err) { next(err); }
});

// Clone workflow
router.post('/:id/clone', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const original = await prisma.workflow.findFirst({ where: { id, userId: req.user.id } });
    if (!original) return res.status(404).json({ message: 'Workflow not found' });
    const clone = await prisma.workflow.create({ data: { name: original.name + ' (Clone)', description: original.description, configuration: original.configuration, status: false, userId: req.user.id } });
    res.status(201).json({ id: clone.id, name: clone.name });
  } catch (err) { next(err); }
});

// Toggle activation
router.post('/:id/activate', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const { active } = req.body;
    const wf = await prisma.workflow.findFirst({ where: { id, userId: req.user.id } });
    if (!wf) return res.status(404).json({ message: 'Workflow not found' });
    await n8nUtils.setWorkflowStatus(id, !!active);
    const updated = await prisma.workflow.update({ where: { id }, data: { status: !!active } });
    res.json({ id: updated.id, status: updated.status });
  } catch (err) { next(err); }
});

module.exports = router;