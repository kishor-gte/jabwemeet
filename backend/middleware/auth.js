const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
}

async function authenticateToken(req, res, next) {
  let token = null;

  // Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Verify account exists and is not suspended/blocked
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, role: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return res.status(403).json({ 
        success: false, 
        message: `Your account has been ${user.status.toLowerCase()}. Access revoked.` 
      });
    }

    req.user = {
      ...decoded,
      userId: user.id,
      role: user.role,
      status: user.status,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
