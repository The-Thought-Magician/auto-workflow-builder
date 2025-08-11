const express = require('express');
const authenticate = require('../middleware/authenticate');
const { 
  storeCredentials, 
  getCredentials, 
  validateCredentials,
  getCredentialRequirements,
  generateOAuthUrl,
  exchangeOAuthCode
} = require('../utils/credentialHandlers');

const router = express.Router();

// Get list of credentials for the current user
router.get('/', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const credentials = await prisma.credential.findMany({ where: { userId: req.user.id } });
    // Return only id and service name
    const sanitized = credentials.map((cred) => ({ id: cred.id, service: cred.service, createdAt: cred.createdAt }));
    res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

// Create a new credential
router.post('/', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { service, data, validate = true } = req.body;
    if (!service || !data) {
      return res.status(400).json({ message: 'Service and data are required' });
    }

    // Validate credentials if requested
    if (validate) {
      const validation = await validateCredentials(service, data);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: 'Invalid credentials', 
          error: validation.error 
        });
      }
    }

    // Store encrypted credentials
    const credential = await storeCredentials(service, data, req.user.id, prisma);
    
    res.status(201).json({ 
      id: credential.id, 
      service: credential.service,
      message: `${service} credentials saved successfully`
    });
  } catch (err) {
    next(err);
  }
});

// Delete a credential
router.delete('/:id', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const cred = await prisma.credential.findUnique({ where: { id } });
    if (!cred || cred.userId !== req.user.id) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    await prisma.credential.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Test a credential connection
router.post('/:id/test', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { id } = req.params;
    const cred = await prisma.credential.findUnique({ where: { id } });
    if (!cred || cred.userId !== req.user.id) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Get decrypted credentials
    const credentialData = await getCredentials(cred.service, req.user.id, prisma);
    if (!credentialData) {
      return res.status(404).json({ message: 'Credential data not found' });
    }

    // Test the credentials
    const result = await validateCredentials(cred.service, credentialData);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get credential requirements for a service
router.get('/requirements/:service', authenticate, async (req, res, next) => {
  try {
    const { service } = req.params;
    const requirements = getCredentialRequirements(service);
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

// Generate OAuth URL for a service
router.post('/oauth/url', authenticate, async (req, res, next) => {
  try {
    const { service, clientId, redirectUri } = req.body;
    if (!service || !clientId || !redirectUri) {
      return res.status(400).json({ 
        message: 'Service, clientId, and redirectUri are required' 
      });
    }

    const state = `${req.user.id}:${Date.now()}`;
    const authUrl = generateOAuthUrl(service, clientId, redirectUri, state);
    
    res.json({ authUrl, state });
  } catch (err) {
    next(err);
  }
});

// Handle OAuth callback
router.post('/oauth/callback', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { service, code, state, clientId, clientSecret, redirectUri } = req.body;
    if (!service || !code || !clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ 
        message: 'Missing required OAuth parameters' 
      });
    }

    // Verify state parameter (basic security check)
    if (!state || !state.startsWith(req.user.id)) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    // Exchange code for token
    const tokenData = await exchangeOAuthCode(
      service, 
      code, 
      clientId, 
      clientSecret, 
      redirectUri
    );

    // Store the credentials
    const credential = await storeCredentials(service, tokenData, req.user.id, prisma);
    
    res.json({ 
      id: credential.id, 
      service: credential.service,
      message: `${service} connected successfully`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;