const express = require('express');
const authenticate = require('../middleware/authenticate');
const { interpretWorkflowRequest } = require('../utils/aiWorkflowInterpreter');

const router = express.Router();

/**
 * POST /api/chat
 *
 * Enhanced chat endpoint that uses AI to interpret workflow automation requests.
 * The AI can understand natural language descriptions and create workflows,
 * request credentials, and guide users through the automation process.
 *
 * Request body should contain a `messages` array in the OpenAI format:
 * {
 *   "messages": [
 *     { "role": "user", "content": "When a customer submits a Typeform, get the data, ask GPT-4 to summarize it, and then post that summary in our 'New Leads' Slack channel." }
 *   ]
 * }
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const userId = req.user.id;
    const prisma = req.prisma;

    // Use AI workflow interpreter to process the request
    const result = await interpretWorkflowRequest(messages, userId, prisma);

    // Format response for frontend
    const response = {
      choices: [{
        message: {
          role: 'assistant',
          content: result.message
        },
        finish_reason: 'stop'
      }],
      functionResults: result.functionResults || []
    };

    res.json(response);
  } catch (err) {
    console.error('Chat error:', err);
    
    // Fallback response if AI fails
    const fallbackResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please make sure your OpenRouter API key is configured correctly and try again.'
        },
        finish_reason: 'stop'
      }],
      functionResults: []
    };
    
    res.json(fallbackResponse);
  }
});

module.exports = router;