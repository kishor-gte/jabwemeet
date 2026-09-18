const prisma = require('../db');

/**
 * Logs an administrative action to the immutable AuditLog table
 */
async function logAudit(req, { action, targetType, targetId, before = null, after = null, reason = null }) {
  try {
    const staffId = req?.staff?.id || req?.user?.userId || 'system';
    const staffName = req?.staff?.name || req?.user?.name || 'Administrator';
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'AdminConsole';

    const auditId = 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" ("id", "staffId", "staffName", "action", "targetType", "targetId", "ipAddress", "userAgent", "beforeData", "afterData", "reason")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
    `,
      auditId,
      staffId,
      staffName,
      action,
      targetType,
      targetId ? String(targetId) : null,
      String(ipAddress),
      String(userAgent).substring(0, 255),
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      reason ? String(reason) : null
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

module.exports = { logAudit };
