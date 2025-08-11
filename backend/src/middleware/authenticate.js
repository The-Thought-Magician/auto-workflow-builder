const jwt = require('jsonwebtoken');

/**
 * Authentication middleware that verifies JWT tokens and attaches the
 * corresponding user object to the request. If no token is present or the
 * token is invalid/expired, the request is rejected with a 401 status.
 */
module.exports = async function authenticate(req, res, next) {
  const prisma = req.prisma;
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find the user in the database and attach to request
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};