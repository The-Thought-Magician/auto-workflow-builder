require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workflowRoutes = require('./routes/workflows');
const credentialRoutes = require('./routes/credentials');
const chatRoutes = require('./routes/chat');

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Attach prisma to request object via middleware
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});