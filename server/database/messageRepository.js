const { pool } = require('./pool');
const { mapMessage } = require('./mappers');

const MSG_SELECT = `
  m.id, m.sender_id, m.receiver_id, m.listing_id, m.content, m.is_read, m.created_at,
  su.id AS sender_uid, su.username AS sender_username, su.first_name AS sender_first_name,
  su.last_name AS sender_last_name, su.avatar AS sender_avatar,
  ru.id AS receiver_uid, ru.username AS receiver_username, ru.first_name AS receiver_first_name,
  ru.last_name AS receiver_last_name, ru.avatar AS receiver_avatar,
  l.title AS listing_title, l.images AS listing_images
`;

async function findForUser(userId) {
  const [rows] = await pool.query(
    `SELECT ${MSG_SELECT}
     FROM messages m
     INNER JOIN users su ON su.id = m.sender_id
     INNER JOIN users ru ON ru.id = m.receiver_id
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId]
  );
  return rows.map(mapMessage);
}

async function findConversation(a, b) {
  const [rows] = await pool.query(
    `SELECT ${MSG_SELECT}
     FROM messages m
     INNER JOIN users su ON su.id = m.sender_id
     INNER JOIN users ru ON ru.id = m.receiver_id
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [a, b, b, a]
  );
  return rows.map(mapMessage);
}

async function create({ senderId, receiverId, listingId, content }) {
  const [result] = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, listing_id, content)
     VALUES (?, ?, ?, ?)`,
    [senderId, receiverId, listingId || null, content]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${MSG_SELECT}
     FROM messages m
     INNER JOIN users su ON su.id = m.sender_id
     INNER JOIN users ru ON ru.id = m.receiver_id
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE m.id = ?`,
    [id]
  );
  const row = rows[0];
  return row ? mapMessage(row) : null;
}

async function markRead(id, receiverId) {
  const [r] = await pool.query(
    'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?',
    [id, receiverId]
  );
  return r.affectedRows > 0;
}

async function countUnreadForUser(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS c FROM messages WHERE receiver_id = ? AND is_read = 0',
    [userId]
  );
  return Number(rows[0].c) || 0;
}

async function markConversationRead(receiverId, senderId) {
  await pool.query(
    `UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
    [receiverId, senderId]
  );
}

module.exports = {
  findForUser,
  findConversation,
  create,
  findById,
  markRead,
  countUnreadForUser,
  markConversationRead,
};
