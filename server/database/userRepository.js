const { pool } = require('./pool');
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, first_name, last_name, phone, location, avatar, is_admin, is_verified, created_at, last_login FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, first_name, last_name, phone, location, avatar, is_admin, is_verified, created_at, last_login FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function existsByUsernameOrEmail(username, email) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );
  return rows.length > 0;
}

async function create({ username, email, password, firstName, lastName, phone, location }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password, first_name, last_name, phone, location)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, email, password, firstName, lastName, phone || null, location || null]
  );
  return result.insertId;
}

async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
}

async function updateProfile(id, { firstName, lastName, phone, location, avatar }) {
  const fields = [];
  const vals = [];
  if (firstName !== undefined) {
    fields.push('first_name = ?');
    vals.push(firstName);
  }
  if (lastName !== undefined) {
    fields.push('last_name = ?');
    vals.push(lastName);
  }
  if (phone !== undefined) {
    fields.push('phone = ?');
    vals.push(phone);
  }
  if (location !== undefined) {
    fields.push('location = ?');
    vals.push(location);
  }
  if (avatar !== undefined) {
    fields.push('avatar = ?');
    vals.push(avatar);
  }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
}

module.exports = {
  findById,
  findByEmail,
  existsByUsernameOrEmail,
  create,
  updateLastLogin,
  updateProfile,
};
