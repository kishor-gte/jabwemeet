const prisma = require('../db');
const { authenticateToken } = require('./auth');

/**
 * Require Admin role and verify SUPER_ADMIN privilege
 * Authorization flow:
 * 1. Authenticated User (token exists and valid) -> 401 if missing/invalid
 * 2. User has ADMIN role -> 403 if not ADMIN
 * 3. Database lookup for current status and staffRole:
 *    - User exists -> 401 if not found
 *    - Account is ACTIVE -> 403 if SUSPENDED or BLOCKED
 *    - staffRole === 'SUPER_ADMIN' -> 403 if not SUPER_ADMIN
 * 4. Attach req.staff with SUPER_ADMIN context and proceed
 */
function requireAdmin() {
  return async (req, res, next) => {
    // 1. Must be authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // 2. Must have ADMIN role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied: Platform Administrator role required' });
    }

    try {
      const staffId = req.user.userId || req.user.id;

      // Query staff member directly with raw SQL for complete reliability
      const staffRows = await prisma.$queryRawUnsafe(
        `SELECT "id", "name", "email", "role", COALESCE("status", 'ACTIVE') as "status", COALESCE("staffRole", 'SUPER_ADMIN') as "staffRole" FROM "User" WHERE "id" = $1 LIMIT 1`,
        staffId
      );

      const staffMember = staffRows[0];
      if (!staffMember) {
        return res.status(401).json({ success: false, message: 'Admin account not found' });
      }

      if (staffMember.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: `Admin account has been ${staffMember.status.toLowerCase()} (access revoked)` });
      }

      // 3. Must have SUPER_ADMIN role
      if (staffMember.staffRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Access denied: SUPER_ADMIN role required' });
      }

      req.staff = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        staffRole: 'SUPER_ADMIN',
      };

      next();
    } catch (error) {
      console.error('Error in requireAdmin middleware:', error);
      return res.status(500).json({ success: false, message: 'Internal authorization error' });
    }
  };
}

module.exports = {
  requireAdmin,
};

