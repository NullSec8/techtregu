const { pool } = require('./pool');

async function create({ listingId, reporterId, reason }) {
  const [result] = await pool.query(
    `INSERT INTO listing_reports (listing_id, reporter_id, reason)
     VALUES (?, ?, ?)`,
    [listingId, reporterId, reason]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      r.id, r.listing_id, r.reporter_id, r.reason, r.status, r.created_at, r.resolved_at, r.resolved_by,
      l.title AS listing_title,
      ru.username AS reporter_username,
      su.username AS resolver_username
     FROM listing_reports r
     INNER JOIN listings l ON l.id = r.listing_id
     INNER JOIN users ru ON ru.id = r.reporter_id
     LEFT JOIN users su ON su.id = r.resolved_by
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listOpen() {
  const [rows] = await pool.query(
    `SELECT
      r.id, r.listing_id, r.reporter_id, r.reason, r.status, r.created_at, r.resolved_at, r.resolved_by,
      l.title AS listing_title,
      ru.username AS reporter_username
     FROM listing_reports r
     INNER JOIN listings l ON l.id = r.listing_id
     INNER JOIN users ru ON ru.id = r.reporter_id
     WHERE r.status = 'open'
     ORDER BY r.created_at DESC
     LIMIT 300`
  );
  return rows;
}

async function resolve(id, adminId) {
  const [r] = await pool.query(
    `UPDATE listing_reports
     SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
     WHERE id = ? AND status = 'open'`,
    [adminId, id]
  );
  return r.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  listOpen,
  resolve,
};
