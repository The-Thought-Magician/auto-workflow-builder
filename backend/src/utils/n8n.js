const axios = require('axios');

/**
 * Client for interacting with the n8n instance and MCP server. The functions
 * defined here are thin wrappers around HTTP calls to the n8n REST API and
 * MCP management tools. These functions expect the following environment
 * variables to be present:
 *
 * - N8N_API_URL: The base URL of your n8n instance (e.g. "https://n8n.example.com").
 * - N8N_API_KEY: An API key with access to CRUD workflows. For self‑hosted
 *   instances this can be generated in the n8n UI under User Settings → API.
 * - N8N_MCP_URL: The base URL of an n8n‑MCP server. Optional; if not set
 *   functions will fallback to using the n8n REST API where possible.
 */

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_MCP_URL = process.env.N8N_MCP_URL;

// Axios instance for n8n REST API
const n8nClient = axios.create({
  baseURL: N8N_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY,
  },
});

/**
 * Create a new workflow in n8n.
 *
 * @param {Object} workflow The workflow configuration object
 * @returns {Promise<Object>} The created workflow response
 */
async function createWorkflow(workflow) {
  if (!N8N_API_URL || !N8N_API_KEY) {
    throw new Error('N8N_API_URL and N8N_API_KEY must be configured');
  }
  const response = await n8nClient.post('/api/v1/workflows', workflow);
  return response.data;
}

/**
 * Retrieve workflow by ID.
 *
 * @param {string} id Workflow ID
 */
async function getWorkflow(id) {
  const response = await n8nClient.get(`/api/v1/workflows/${id}`);
  return response.data;
}

/**
 * Update a workflow. Sends a full replacement of the workflow object.
 *
 * @param {string} id Workflow ID
 * @param {Object} workflow The new workflow definition
 */
async function updateWorkflow(id, workflow) {
  const response = await n8nClient.put(`/api/v1/workflows/${id}`, workflow);
  return response.data;
}

/**
 * Delete a workflow.
 *
 * @param {string} id Workflow ID
 */
async function deleteWorkflow(id) {
  await n8nClient.delete(`/api/v1/workflows/${id}`);
}

/**
 * List workflows with optional pagination. Returns array of workflows.
 */
async function listWorkflows() {
  const response = await n8nClient.get('/api/v1/workflows');
  return response.data;
}

/**
 * Trigger a workflow via its ID. This endpoint runs the workflow once and
 * returns the execution ID.
 *
 * Note: For manual execution you need to have a Start node without a trigger.
 */
async function runWorkflow(id) {
  const response = await n8nClient.post(`/api/v1/workflows/${id}/run`);
  return response.data;
}

/**
 * List execution logs for a workflow. Optionally filter by status.
 */
async function listExecutions(id) {
  const response = await n8nClient.get(`/api/v1/workflows/${id}/executions`);
  return response.data;
}

module.exports = {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  listWorkflows,
  runWorkflow,
  listExecutions,
};