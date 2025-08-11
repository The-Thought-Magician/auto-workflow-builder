const axios = require('axios');
const { encryptData, decryptData } = require('./crypto');

/**
 * Service-specific credential handlers
 * 
 * This module provides utilities for handling authentication with various
 * external services including OAuth flows, API key validation, and 
 * secure credential storage.
 */

/**
 * Service configurations for credential handling
 */
const SERVICE_CONFIGS = {
  typeform: {
    name: 'Typeform',
    type: 'oauth',
    authUrl: 'https://api.typeform.com/oauth/authorize',
    tokenUrl: 'https://api.typeform.com/oauth/token',
    scope: 'accounts:read forms:read responses:read',
    testEndpoint: 'https://api.typeform.com/me'
  },
  slack: {
    name: 'Slack',
    type: 'oauth',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scope: 'chat:write channels:read',
    testEndpoint: 'https://slack.com/api/auth.test'
  },
  gmail: {
    name: 'Gmail',
    type: 'oauth',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    testEndpoint: 'https://www.googleapis.com/gmail/v1/users/me/profile'
  },
  'google-sheets': {
    name: 'Google Sheets',
    type: 'oauth',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    testEndpoint: 'https://sheets.googleapis.com/v4/spreadsheets'
  },
  openai: {
    name: 'OpenAI',
    type: 'api_key',
    testEndpoint: 'https://api.openai.com/v1/models'
  }
};

/**
 * Generate OAuth authorization URL for a service
 */
function generateOAuthUrl(service, clientId, redirectUri, state) {
  const config = SERVICE_CONFIGS[service];
  if (!config || config.type !== 'oauth') {
    throw new Error(`OAuth not supported for service: ${service}`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: state
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
async function exchangeOAuthCode(service, code, clientId, clientSecret, redirectUri) {
  const config = SERVICE_CONFIGS[service];
  if (!config || config.type !== 'oauth') {
    throw new Error(`OAuth not supported for service: ${service}`);
  }

  try {
    const response = await axios.post(config.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`OAuth exchange failed for ${service}:`, error.response?.data);
    throw new Error(`Failed to exchange OAuth code for ${service}`);
  }
}

/**
 * Validate API key for API key-based services
 */
async function validateApiKey(service, apiKey) {
  const config = SERVICE_CONFIGS[service];
  if (!config || config.type !== 'api_key') {
    throw new Error(`API key validation not supported for service: ${service}`);
  }

  try {
    let headers = {};
    
    switch (service) {
      case 'openai':
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        break;
      default:
        headers = {
          'Authorization': `Bearer ${apiKey}`
        };
    }

    const response = await axios.get(config.testEndpoint, { headers });
    return { valid: true, data: response.data };
  } catch (error) {
    console.error(`API key validation failed for ${service}:`, error.response?.data);
    return { valid: false, error: error.message };
  }
}

/**
 * Test OAuth token validity
 */
async function testOAuthToken(service, tokenData) {
  const config = SERVICE_CONFIGS[service];
  if (!config || config.type !== 'oauth') {
    throw new Error(`OAuth token test not supported for service: ${service}`);
  }

  try {
    let headers = {};
    
    switch (service) {
      case 'slack':
        headers = {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        };
        break;
      case 'gmail':
      case 'google-sheets':
        headers = {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        };
        break;
      case 'typeform':
        headers = {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        };
        break;
    }

    const response = await axios.get(config.testEndpoint, { headers });
    return { valid: true, data: response.data };
  } catch (error) {
    console.error(`OAuth token test failed for ${service}:`, error.response?.data);
    return { valid: false, error: error.message };
  }
}

/**
 * Store encrypted credentials in database
 */
async function storeCredentials(service, credentialData, userId, prisma) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  // Encrypt the credential data
  const encrypted = encryptData(JSON.stringify(credentialData), encryptionKey);

  // Check if credentials already exist for this service
  const existing = await prisma.credential.findFirst({
    where: {
      userId,
      service
    }
  });

  let credential;
  if (existing) {
    // Update existing credentials
    credential = await prisma.credential.update({
      where: { id: existing.id },
      data: {
        encryptedData: encrypted,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new credentials
    credential = await prisma.credential.create({
      data: {
        service,
        encryptedData: encrypted,
        userId
      }
    });
  }

  return credential;
}

/**
 * Retrieve and decrypt credentials from database
 */
async function getCredentials(service, userId, prisma) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const credential = await prisma.credential.findFirst({
    where: {
      userId,
      service
    }
  });

  if (!credential) {
    return null;
  }

  try {
    const decrypted = decryptData(credential.encryptedData, encryptionKey);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt credentials:', error);
    throw new Error('Failed to decrypt credentials');
  }
}

/**
 * Refresh OAuth token if supported and needed
 */
async function refreshOAuthToken(service, tokenData, clientId, clientSecret) {
  const config = SERVICE_CONFIGS[service];
  if (!config || config.type !== 'oauth' || !tokenData.refresh_token) {
    throw new Error(`Token refresh not supported for service: ${service}`);
  }

  try {
    const response = await axios.post(config.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
      client_id: clientId,
      client_secret: clientSecret
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Merge new token with existing data
    return {
      ...tokenData,
      ...response.data,
      refreshed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Token refresh failed for ${service}:`, error.response?.data);
    throw new Error(`Failed to refresh token for ${service}`);
  }
}

/**
 * Get credential requirements for frontend display
 */
function getCredentialRequirements(service) {
  const config = SERVICE_CONFIGS[service];
  if (!config) {
    throw new Error(`Unknown service: ${service}`);
  }

  const baseRequirements = {
    service,
    name: config.name,
    type: config.type
  };

  if (config.type === 'oauth') {
    return {
      ...baseRequirements,
      requiresOAuth: true,
      scope: config.scope,
      description: `Connect your ${config.name} account to enable automation`
    };
  } else if (config.type === 'api_key') {
    return {
      ...baseRequirements,
      requiresApiKey: true,
      description: `Enter your ${config.name} API key to enable automation`,
      instructions: getApiKeyInstructions(service)
    };
  }

  return baseRequirements;
}

/**
 * Get API key setup instructions for different services
 */
function getApiKeyInstructions(service) {
  switch (service) {
    case 'openai':
      return [
        'Go to https://platform.openai.com/api-keys',
        'Sign in to your OpenAI account',
        'Click "Create new secret key"',
        'Copy the generated API key',
        'Paste it in the field below'
      ];
    default:
      return ['Contact your service provider for API key setup instructions'];
  }
}

/**
 * Validate credentials for a service
 */
async function validateCredentials(service, credentialData) {
  const config = SERVICE_CONFIGS[service];
  if (!config) {
    throw new Error(`Unknown service: ${service}`);
  }

  if (config.type === 'api_key') {
    return await validateApiKey(service, credentialData.apiKey);
  } else if (config.type === 'oauth') {
    return await testOAuthToken(service, credentialData);
  }

  return { valid: false, error: 'Unsupported credential type' };
}

module.exports = {
  SERVICE_CONFIGS,
  generateOAuthUrl,
  exchangeOAuthCode,
  validateApiKey,
  testOAuthToken,
  storeCredentials,
  getCredentials,
  refreshOAuthToken,
  getCredentialRequirements,
  validateCredentials
};