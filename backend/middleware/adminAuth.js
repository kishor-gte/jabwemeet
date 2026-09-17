const prisma = require('../db');
const { authenticateToken } = require('./auth');

// Role hierarchy / permission mapping
const STAFF_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  OPERATIONS_ADMIN: ['USERS', 'EVENTS', 'MANAGERS', 'BUDDIES', 'MATCHMAKING', 'SERVICES', 'ANALYTICS', 'OVERVIEW', 'SEARCH'],
  EVENT_ADMIN: ['EVENTS', 'MANAGERS', 'ANALYTICS', 'OVERVIEW', 'SEARCH'],
  FINANCE_ADMIN: ['PAYMENTS', 'REFUNDS', 'INVOICES', 'SUBSCRIPTIONS', 'PACKAGES', 'COUPONS', 'ANALYTICS', 'OVERVIEW', 'SEARCH'],
  SAFETY_ADMIN: ['SAFETY', 'REPORTS', 'VERIFICATION', 'USERS_RESTRICTED', 'OVERVIEW', 'SEARCH'],
  CONTENT_ADMIN: ['CONTENT', 'REVIEWS', 'NOTIFICATIONS', 'COUPONS', 'OVERVIEW', 'SEARCH'],
  SUPPORT_ADMIN: ['SUPPORT', 'REPORTS_READ', 'USERS_READ', 'OVERVIEW', 'SEARCH'],
};

/**
 * Require Admin role and verify staff permission
 * @param {string} permissionCategory - 'USERS', 'EVENTS', 'PAYMENTS', etc. Optional.
 */
function requireAdmin(permissionCategory = null) {
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

      if (staffMember.status === 'SUSPENDED' || staffMember.status === 'BLOCKED') {
        return res.status(403).json({ success: false, message: 'Admin account has been suspended or blocked' });
      }

      req.staff = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        staffRole: staffMember.staffRole,
      };

      // 4. Check specific permission if requested
      if (permissionCategory) {
        const allowedPermissions = STAFF_PERMISSIONS[staffMember.staffRole] || [];
        const hasPermission = allowedPermissions.includes('*') || allowedPermissions.includes(permissionCategory);

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: `Access denied: Insufficient staff permissions. '${permissionCategory}' requires elevated privileges.`,
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error in requireAdmin middleware:', error);
      return res.status(500).json({ success: false, message: 'Internal authorization error' });
    }
  };
}

module.exports = {
  requireAdmin,
  STAFF_PERMISSIONS,
};
