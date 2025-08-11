const { v4: uuidv4 } = require('uuid');

/**
 * N8N Workflow Generator
 * 
 * This module contains utilities for generating n8n workflow configurations
 * based on AI-interpreted user requirements. It provides functions to create
 * standard n8n node configurations for common services and operations.
 */

/**
 * Generate a basic n8n workflow structure
 */
function createBaseWorkflow(name, description = '') {
  return {
    name,
    active: false,
    nodes: [],
    connections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      saveManualExecutions: true
    },
    staticData: null,
    tags: []
  };
}

/**
 * Create a Webhook trigger node (for receiving HTTP requests)
 */
function createWebhookTrigger(webhookPath = '/webhook') {
  return {
    id: uuidv4(),
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    position: [240, 300],
    parameters: {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'responseNode'
    }
  };
}

/**
 * Create a Manual trigger node (for manual execution)
 */
function createManualTrigger() {
  return {
    id: uuidv4(),
    name: 'Manual Trigger',
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position: [240, 300],
    parameters: {}
  };
}

/**
 * Create a Typeform trigger node
 */
function createTypeformTrigger(credentialId) {
  return {
    id: uuidv4(),
    name: 'Typeform Trigger',
    type: 'n8n-nodes-base.typeformTrigger',
    typeVersion: 1,
    position: [240, 300],
    parameters: {
      formId: '{{TYPEFORM_FORM_ID}}' // To be configured by user
    },
    credentials: {
      typeformApi: {
        id: credentialId,
        name: 'Typeform API'
      }
    }
  };
}

/**
 * Create an OpenAI/GPT node for text processing
 */
function createOpenAINode(credentialId, prompt, position = [460, 300]) {
  return {
    id: uuidv4(),
    name: 'OpenAI GPT',
    type: 'n8n-nodes-base.openAi',
    typeVersion: 1,
    position,
    parameters: {
      operation: 'text',
      model: 'gpt-3.5-turbo',
      prompt: prompt || 'Summarize the following data:\n\n{{ $json }}',
      maxTokens: 500,
      temperature: 0.7
    },
    credentials: {
      openAiApi: {
        id: credentialId,
        name: 'OpenAI API'
      }
    }
  };
}

/**
 * Create a Slack node for sending messages
 */
function createSlackNode(credentialId, channel, message, position = [680, 300]) {
  return {
    id: uuidv4(),
    name: 'Slack',
    type: 'n8n-nodes-base.slack',
    typeVersion: 1,
    position,
    parameters: {
      operation: 'postMessage',
      channel: channel || '#general',
      text: message || '{{ $json.choices[0].message.content }}'
    },
    credentials: {
      slackApi: {
        id: credentialId,
        name: 'Slack API'
      }
    }
  };
}

/**
 * Create a Gmail node for sending emails
 */
function createGmailNode(credentialId, to, subject, message, position = [680, 300]) {
  return {
    id: uuidv4(),
    name: 'Gmail',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 1,
    position,
    parameters: {
      operation: 'send',
      to: to || '{{$json.email}}',
      subject: subject || 'Automated Email',
      message: message || '{{ $json.content }}'
    },
    credentials: {
      gmailOAuth2: {
        id: credentialId,
        name: 'Gmail OAuth2'
      }
    }
  };
}

/**
 * Create a Google Sheets node for reading/writing data
 */
function createGoogleSheetsNode(credentialId, operation = 'append', spreadsheetId, range, position = [680, 300]) {
  return {
    id: uuidv4(),
    name: 'Google Sheets',
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 1,
    position,
    parameters: {
      operation,
      documentId: spreadsheetId || '{{SPREADSHEET_ID}}',
      sheetName: 'Sheet1',
      range: range || 'A:Z',
      options: {}
    },
    credentials: {
      googleSheetsOAuth2Api: {
        id: credentialId,
        name: 'Google Sheets OAuth2'
      }
    }
  };
}

/**
 * Create a HTTP Request node for custom API calls
 */
function createHttpNode(url, method = 'GET', body = null, headers = {}, position = [460, 300]) {
  return {
    id: uuidv4(),
    name: 'HTTP Request',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4,
    position,
    parameters: {
      url: url || 'https://api.example.com/endpoint',
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: headers,
      options: {}
    }
  };
}

/**
 * Create a Function node for custom JavaScript processing
 */
function createFunctionNode(code, position = [460, 300]) {
  return {
    id: uuidv4(),
    name: 'Function',
    type: 'n8n-nodes-base.function',
    typeVersion: 1,
    position,
    parameters: {
      functionCode: code || `// Process the input data
const input = $input.all();
return input.map(item => ({
  ...item.json,
  processed: true,
  timestamp: new Date().toISOString()
}));`
    }
  };
}

/**
 * Create a Set node for data transformation
 */
function createSetNode(values = {}, position = [460, 300]) {
  return {
    id: uuidv4(),
    name: 'Set',
    type: 'n8n-nodes-base.set',
    typeVersion: 1,
    position,
    parameters: {
      values: {
        string: Object.entries(values).map(([key, value]) => ({
          name: key,
          value: value
        }))
      },
      options: {}
    }
  };
}

/**
 * Create connections between nodes
 */
function createConnections(nodes) {
  const connections = {};
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];
    
    connections[currentNode.name] = {
      main: [
        [
          {
            node: nextNode.name,
            type: 'main',
            index: 0
          }
        ]
      ]
    };
  }
  
  return connections;
}

/**
 * Service credential requirements mapping
 */
const CREDENTIAL_REQUIREMENTS = {
  typeform: {
    type: 'typeformApi',
    name: 'Typeform API',
    fields: ['accessToken']
  },
  openai: {
    type: 'openAiApi', 
    name: 'OpenAI API',
    fields: ['apiKey']
  },
  slack: {
    type: 'slackApi',
    name: 'Slack API', 
    fields: ['accessToken']
  },
  gmail: {
    type: 'gmailOAuth2',
    name: 'Gmail OAuth2',
    fields: ['oauthTokenData']
  },
  'google-sheets': {
    type: 'googleSheetsOAuth2Api',
    name: 'Google Sheets OAuth2',
    fields: ['oauthTokenData'] 
  }
};

/**
 * Generate a complete workflow based on interpreted requirements
 */
function generateWorkflow(requirements) {
  const {
    name,
    description,
    trigger,
    actions,
    credentials
  } = requirements;

  const workflow = createBaseWorkflow(name, description);
  const nodes = [];
  let xPosition = 240;
  const yPosition = 300;

  // Create trigger node
  let triggerNode;
  switch (trigger.type) {
    case 'typeform':
      triggerNode = createTypeformTrigger(credentials.typeform);
      break;
    case 'webhook':
      triggerNode = createWebhookTrigger(trigger.path);
      break;
    case 'manual':
    default:
      triggerNode = createManualTrigger();
  }
  
  triggerNode.position = [xPosition, yPosition];
  nodes.push(triggerNode);
  xPosition += 220;

  // Create action nodes
  actions.forEach(action => {
    let actionNode;
    
    switch (action.type) {
      case 'openai':
        actionNode = createOpenAINode(
          credentials.openai,
          action.prompt,
          [xPosition, yPosition]
        );
        break;
      case 'slack':
        actionNode = createSlackNode(
          credentials.slack,
          action.channel,
          action.message,
          [xPosition, yPosition]
        );
        break;
      case 'gmail':
        actionNode = createGmailNode(
          credentials.gmail,
          action.to,
          action.subject,
          action.message,
          [xPosition, yPosition]
        );
        break;
      case 'google-sheets':
        actionNode = createGoogleSheetsNode(
          credentials['google-sheets'],
          action.operation,
          action.spreadsheetId,
          action.range,
          [xPosition, yPosition]
        );
        break;
      case 'http':
        actionNode = createHttpNode(
          action.url,
          action.method,
          action.body,
          action.headers,
          [xPosition, yPosition]
        );
        break;
      case 'function':
        actionNode = createFunctionNode(
          action.code,
          [xPosition, yPosition]
        );
        break;
      case 'set':
        actionNode = createSetNode(
          action.values,
          [xPosition, yPosition]
        );
        break;
    }
    
    if (actionNode) {
      nodes.push(actionNode);
      xPosition += 220;
    }
  });

  workflow.nodes = nodes;
  workflow.connections = createConnections(nodes);

  return workflow;
}

/**
 * Detect required services from user input
 */
function detectServices(userInput) {
  const input = userInput.toLowerCase();
  const services = [];
  
  if (input.includes('typeform')) services.push('typeform');
  if (input.includes('openai') || input.includes('gpt') || input.includes('chatgpt')) services.push('openai');
  if (input.includes('slack')) services.push('slack');
  if (input.includes('gmail') || input.includes('email')) services.push('gmail');
  if (input.includes('google sheets') || input.includes('spreadsheet')) services.push('google-sheets');
  
  return services;
}

module.exports = {
  createBaseWorkflow,
  createWebhookTrigger,
  createManualTrigger,
  createTypeformTrigger,
  createOpenAINode,
  createSlackNode,
  createGmailNode,
  createGoogleSheetsNode,
  createHttpNode,
  createFunctionNode,
  createSetNode,
  createConnections,
  generateWorkflow,
  detectServices,
  CREDENTIAL_REQUIREMENTS
};