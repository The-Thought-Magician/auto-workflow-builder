const axios = require('axios');
const { generateWorkflow, detectServices, CREDENTIAL_REQUIREMENTS } = require('./workflowGenerator');

/**
 * AI Workflow Interpreter
 * 
 * This module handles the AI-powered interpretation of user requests
 * and converts them into actionable workflow configurations.
 */

/**
 * Function definitions for AI function calling
 */
const WORKFLOW_FUNCTIONS = [
  {
    name: 'create_workflow',
    description: 'Create a new automation workflow based on user requirements',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'A descriptive name for the workflow'
        },
        description: {
          type: 'string', 
          description: 'A brief description of what the workflow does'
        },
        trigger: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['typeform', 'webhook', 'manual'],
              description: 'The type of trigger that starts the workflow'
            },
            path: {
              type: 'string',
              description: 'Webhook path (only for webhook triggers)'
            }
          },
          required: ['type']
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['openai', 'slack', 'gmail', 'google-sheets', 'http', 'function', 'set'],
                description: 'The type of action to perform'
              },
              prompt: {
                type: 'string',
                description: 'AI prompt (for openai actions)'
              },
              channel: {
                type: 'string', 
                description: 'Slack channel name (for slack actions)'
              },
              message: {
                type: 'string',
                description: 'Message content (for slack/notification actions)'
              },
              to: {
                type: 'string',
                description: 'Email recipient (for gmail actions)'
              },
              subject: {
                type: 'string',
                description: 'Email subject (for gmail actions)'
              },
              operation: {
                type: 'string',
                description: 'Operation type (for service-specific actions)'
              },
              url: {
                type: 'string',
                description: 'API endpoint URL (for http actions)'
              },
              method: {
                type: 'string',
                description: 'HTTP method (for http actions)'
              }
            },
            required: ['type']
          }
        },
        required_services: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['typeform', 'openai', 'slack', 'gmail', 'google-sheets']
          },
          description: 'List of external services that need credentials'
        }
      },
      required: ['name', 'description', 'trigger', 'actions', 'required_services']
    }
  },
  {
    name: 'request_credentials',
    description: 'Request user credentials for external services',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          enum: ['typeform', 'openai', 'slack', 'gmail', 'google-sheets'],
          description: 'The service requiring credentials'
        },
        message: {
          type: 'string',
          description: 'Friendly message explaining why credentials are needed'
        }
      },
      required: ['service', 'message']
    }
  },
  {
    name: 'explain_workflow',
    description: 'Explain how a workflow will work to the user',
    parameters: {
      type: 'object',
      properties: {
        explanation: {
          type: 'string',
          description: 'Clear explanation of the workflow steps and functionality'
        },
        next_steps: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of next steps for the user'
        }
      },
      required: ['explanation', 'next_steps']
    }
  }
];

/**
 * System prompt for the AI workflow interpreter
 */
const SYSTEM_PROMPT = `You are an AI workflow automation assistant. Your job is to help users create automated workflows by interpreting their natural language requests.

Key capabilities:
1. Analyze user requests and identify what automation they need
2. Break down complex workflows into trigger + action sequences  
3. Identify required external service credentials
4. Guide users through the workflow creation process
5. Create n8n-compatible workflow configurations

Supported triggers:
- typeform: For Typeform form submissions
- webhook: For HTTP webhook triggers
- manual: For manually triggered workflows

Supported actions:
- openai: AI text processing with GPT models
- slack: Send messages to Slack channels
- gmail: Send emails via Gmail
- google-sheets: Read/write Google Sheets data
- http: Make HTTP API requests
- function: Custom JavaScript processing
- set: Transform/set data values

When a user describes a workflow:
1. First, use explain_workflow to clarify what you understand
2. If credentials are needed, use request_credentials for each service
3. Once everything is clear, use create_workflow to generate the configuration

Be conversational and helpful. Ask clarifying questions when needed.
Guide users through credential setup step by step.
Make the complex simple and automate the tedious!`;

/**
 * Call OpenRouter API with function calling capabilities
 */
async function callAIWithFunctions(messages, availableFunctions = WORKFLOW_FUNCTIONS) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';

  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ],
    tools: availableFunctions.map(func => ({
      type: 'function',
      function: func
    })),
    tool_choice: 'auto',
    max_tokens: 2000,
    temperature: 0.2
  };

  try {
    const response = await axios.post(`${baseURL}/chat/completions`, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('AI API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Process function calls returned by the AI
 */
async function processFunctionCalls(functionCalls, userId, prisma) {
  const results = [];

  for (const call of functionCalls) {
    const { name, arguments: args } = call.function;
    
    try {
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
      
      switch (name) {
        case 'create_workflow':
          const result = await handleCreateWorkflow(parsedArgs, userId, prisma);
          results.push({
            type: 'workflow_created',
            data: result
          });
          break;
          
        case 'request_credentials':
          results.push({
            type: 'credential_request',
            data: {
              service: parsedArgs.service,
              message: parsedArgs.message,
              requirements: CREDENTIAL_REQUIREMENTS[parsedArgs.service]
            }
          });
          break;
          
        case 'explain_workflow':
          results.push({
            type: 'explanation',
            data: {
              explanation: parsedArgs.explanation,
              next_steps: parsedArgs.next_steps
            }
          });
          break;
      }
    } catch (error) {
      console.error(`Error processing function call ${name}:`, error);
      results.push({
        type: 'error',
        data: { message: `Failed to process ${name}: ${error.message}` }
      });
    }
  }

  return results;
}

/**
 * Handle workflow creation
 */
async function handleCreateWorkflow(workflowSpec, userId, prisma) {
  try {
    // Check if user has required credentials
    const userCredentials = await prisma.credential.findMany({
      where: { userId }
    });

    const credentialMap = {};
    userCredentials.forEach(cred => {
      credentialMap[cred.service] = cred.id;
    });

    // Verify all required services have credentials
    const missingCredentials = workflowSpec.required_services.filter(
      service => !credentialMap[service]
    );

    if (missingCredentials.length > 0) {
      return {
        status: 'missing_credentials',
        missing: missingCredentials,
        message: `Missing credentials for: ${missingCredentials.join(', ')}`
      };
    }

    // Generate n8n workflow configuration
    const workflowConfig = generateWorkflow({
      name: workflowSpec.name,
      description: workflowSpec.description,
      trigger: workflowSpec.trigger,
      actions: workflowSpec.actions,
      credentials: credentialMap
    });

    // Save workflow to database
    const workflow = await prisma.workflow.create({
      data: {
        name: workflowSpec.name,
        description: workflowSpec.description,
        configuration: workflowConfig,
        status: false, // Initially inactive
        userId
      }
    });

    return {
      status: 'created',
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description
      },
      message: `Workflow "${workflowSpec.name}" created successfully! You can view and activate it in your workflows dashboard.`
    };

  } catch (error) {
    console.error('Error creating workflow:', error);
    return {
      status: 'error',
      message: `Failed to create workflow: ${error.message}`
    };
  }
}

/**
 * Main function to interpret user messages and generate responses
 */
async function interpretWorkflowRequest(messages, userId, prisma) {
  try {
    // Call AI with function calling capabilities
    const aiResponse = await callAIWithFunctions(messages);
    
    const choice = aiResponse.choices?.[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    let response = {
      message: choice.message?.content || '',
      functionResults: []
    };

    // Process any function calls
    if (choice.message?.tool_calls?.length > 0) {
      const functionResults = await processFunctionCalls(
        choice.message.tool_calls, 
        userId, 
        prisma
      );
      response.functionResults = functionResults;
    }

    return response;
    
  } catch (error) {
    console.error('Error interpreting workflow request:', error);
    throw error;
  }
}

/**
 * Check if user has credentials for a service
 */
async function hasCredentials(userId, service, prisma) {
  const credential = await prisma.credential.findFirst({
    where: { 
      userId,
      service 
    }
  });
  return !!credential;
}

/**
 * Get missing credentials for detected services
 */
async function getMissingCredentials(userInput, userId, prisma) {
  const detectedServices = detectServices(userInput);
  const missing = [];
  
  for (const service of detectedServices) {
    const hasCreds = await hasCredentials(userId, service, prisma);
    if (!hasCreds) {
      missing.push({
        service,
        requirements: CREDENTIAL_REQUIREMENTS[service]
      });
    }
  }
  
  return missing;
}

module.exports = {
  interpretWorkflowRequest,
  getMissingCredentials,
  hasCredentials,
  WORKFLOW_FUNCTIONS,
  SYSTEM_PROMPT
};