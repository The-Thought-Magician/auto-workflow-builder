const axios = require('axios');

/**
 * N8N MCP Client
 * 
 * This module provides a client interface for interacting with the n8n-mcp server
 * which enables advanced workflow management capabilities through the Model Context Protocol.
 */

class N8nMCPClient {
  constructor() {
    this.baseURL = process.env.N8N_MCP_URL || 'http://n8n-mcp:3000';
    this.authToken = process.env.MCP_AUTH_TOKEN || 'mcp-auth-token-12345';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Test connection to MCP server
   */
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return { connected: true, data: response.data };
    } catch (error) {
      console.warn('MCP server not available:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Create a workflow using MCP
   */
  async createWorkflow(workflowDefinition) {
    try {
      const response = await this.client.post('/workflows', workflowDefinition);
      return response.data;
    } catch (error) {
      console.error('MCP createWorkflow error:', error.response?.data || error.message);
      throw new Error(`MCP workflow creation failed: ${error.message}`);
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId) {
    try {
      const response = await this.client.get(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('MCP getWorkflow error:', error.response?.data || error.message);
      throw new Error(`MCP workflow retrieval failed: ${error.message}`);
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, workflowDefinition) {
    try {
      const response = await this.client.put(`/workflows/${workflowId}`, workflowDefinition);
      return response.data;
    } catch (error) {
      console.error('MCP updateWorkflow error:', error.response?.data || error.message);
      throw new Error(`MCP workflow update failed: ${error.message}`);
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    try {
      await this.client.delete(`/workflows/${workflowId}`);
      return { success: true };
    } catch (error) {
      console.error('MCP deleteWorkflow error:', error.response?.data || error.message);
      throw new Error(`MCP workflow deletion failed: ${error.message}`);
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows() {
    try {
      const response = await this.client.get('/workflows');
      return response.data;
    } catch (error) {
      console.error('MCP listWorkflows error:', error.response?.data || error.message);
      throw new Error(`MCP workflow listing failed: ${error.message}`);
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, inputData = {}) {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data: inputData
      });
      return response.data;
    } catch (error) {
      console.error('MCP executeWorkflow error:', error.response?.data || error.message);
      throw new Error(`MCP workflow execution failed: ${error.message}`);
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(workflowId, limit = 50) {
    try {
      const response = await this.client.get(`/workflows/${workflowId}/executions`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('MCP getExecutionHistory error:', error.response?.data || error.message);
      throw new Error(`MCP execution history retrieval failed: ${error.message}`);
    }
  }

  /**
   * Activate/deactivate workflow
   */
  async setWorkflowStatus(workflowId, active) {
    try {
      const response = await this.client.patch(`/workflows/${workflowId}/status`, {
        active
      });
      return response.data;
    } catch (error) {
      console.error('MCP setWorkflowStatus error:', error.response?.data || error.message);
      throw new Error(`MCP workflow status update failed: ${error.message}`);
    }
  }

  /**
   * Get available nodes/integrations
   */
  async getAvailableNodes() {
    try {
      const response = await this.client.get('/nodes');
      return response.data;
    } catch (error) {
      console.error('MCP getAvailableNodes error:', error.response?.data || error.message);
      return []; // Return empty array if MCP not available
    }
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflow(workflowDefinition) {
    try {
      const response = await this.client.post('/workflows/validate', workflowDefinition);
      return response.data;
    } catch (error) {
      console.error('MCP validateWorkflow error:', error.response?.data || error.message);
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId) {
    try {
      const response = await this.client.get(`/workflows/${workflowId}/stats`);
      return response.data;
    } catch (error) {
      console.error('MCP getWorkflowStats error:', error.response?.data || error.message);
      return null;
    }
  }
}

// Create singleton instance
const mcpClient = new N8nMCPClient();

/**
 * Enhanced n8n utilities that prefer MCP when available, fallback to direct API
 */
class EnhancedN8nUtils {
  constructor() {
    this.mcpClient = mcpClient;
    this.directN8n = require('./n8n');
  }

  async createWorkflow(workflow) {
    // Try MCP first, fallback to direct API
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.createWorkflow(workflow);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.createWorkflow(workflow);
  }

  async getWorkflow(id) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.getWorkflow(id);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.getWorkflow(id);
  }

  async updateWorkflow(id, workflow) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.updateWorkflow(id, workflow);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.updateWorkflow(id, workflow);
  }

  async deleteWorkflow(id) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.deleteWorkflow(id);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.deleteWorkflow(id);
  }

  async listWorkflows() {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.listWorkflows();
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.listWorkflows();
  }

  async runWorkflow(id, inputData = {}) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.executeWorkflow(id, inputData);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.runWorkflow(id);
  }

  async listExecutions(id) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.getExecutionHistory(id);
      }
    } catch (error) {
      console.warn('MCP not available, using direct n8n API');
    }
    
    return await this.directN8n.listExecutions(id);
  }

  // MCP-specific enhanced methods
  async validateWorkflow(workflow) {
    try {
      return await this.mcpClient.validateWorkflow(workflow);
    } catch (error) {
      return { valid: true, warnings: ['Validation not available without MCP'] };
    }
  }

  async getWorkflowStats(id) {
    try {
      return await this.mcpClient.getWorkflowStats(id);
    } catch (error) {
      return null;
    }
  }

  async setWorkflowStatus(id, active) {
    try {
      const mcpStatus = await this.mcpClient.testConnection();
      if (mcpStatus.connected) {
        return await this.mcpClient.setWorkflowStatus(id, active);
      }
    } catch (error) {
      console.warn('MCP not available for status update');
    }
    
    // Fallback: get current workflow and update with new status
    const workflow = await this.getWorkflow(id);
    workflow.active = active;
    return await this.updateWorkflow(id, workflow);
  }
}

module.exports = {
  N8nMCPClient,
  mcpClient,
  EnhancedN8nUtils
};