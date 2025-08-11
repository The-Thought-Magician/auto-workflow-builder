const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get current user's profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const { id, name, email, subscription, createdAt } = req.user;
    res.json({ id, name, email, subscription, createdAt });
  } catch (err) {
    next(err);
  }
});

// Update current user's profile
router.put('/profile', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { name, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await prisma.user.update({ where: { id: req.user.id }, data: updates });
    res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, subscription: updatedUser.subscription });
  } catch (err) {
    next(err);
  }
});

// Get subscription info
router.get('/subscription', authenticate, async (req, res, next) => {
  try {
    res.json({ plan: req.user.subscription });
  } catch (err) { next(err); }
});

// Update subscription (placeholder – integrate Stripe or billing provider later)
router.post('/subscription', authenticate, async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { plan } = req.body; // Expected values: Free, Pro, etc.
    if (!plan) return res.status(400).json({ message: 'Plan is required' });
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { subscription: plan } });
    res.json({ plan: updated.subscription });
  } catch (err) { next(err); }
});

module.exports = router;