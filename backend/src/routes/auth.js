const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription } });
  } catch (err) {
    next(err);
  }
});

// Login existing user
router.post('/login', async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// Forgot password - issue reset token (logged to console for now)
router.post('/forgot-password', async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal if user exists
      return res.json({ message: 'If that account exists, a reset link was sent' });
    }
    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    // Store
    await prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
    // In production, email the rawToken link. Here we log for developer convenience.
    console.log(`Password reset token for ${email}: ${rawToken}`);
    res.json({ message: 'If that account exists, a reset link was sent' });
  } catch (err) {
    next(err);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  const prisma = req.prisma;
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) return res.status(400).json({ message: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});