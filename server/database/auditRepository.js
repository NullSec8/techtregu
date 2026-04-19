const { pool } = require('./pool');

async function logAudit(userId, action, resource, meta, req) {
  try {
    await pool.query(
      `INSERT INTO audit_events (user_id, action, resource, meta, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, resource, meta ? JSON.stringify(meta) : null, req?.ip || req?.connection?.remoteAddress, req?.get('User-Agent') || req?.headers?.['user-agent']]
    );
  } catch (err) {
    console.error('[Audit] Failed to log:', err.message);
  }
}

async function getAuditLogs(userId, limit = 100) {
  const lim = Math.min(Math.max(Number(limit), 1), 500);
  const [rows] = await pool.query(
    `SELECT * FROM audit_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, lim]
  );
  return rows;
}

async function getUserConsents(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM user_consents WHERE user_id = ?`,
    [userId]
  );
  const consents = {};
  for (const r of rows) {
    consents[r.consent_key] = !!r.granted;
  }
  return consents;
}

async function setConsent(userId, key, granted) {
  await pool.query(
    `INSERT INTO user_consents (user_id, consent_key, granted, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE granted = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, key, granted ? 1 : 0, granted ? 1 : 0]
  );
}

module.exports = { logAudit, getAuditLogs, getUserConsents, setConsent };