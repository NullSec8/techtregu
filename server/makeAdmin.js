/**
 * Promote a user to admin by email.
 *
 * Usage:
 *   npm run make-admin -- user@example.com
 */
require('dotenv').config();
const { pool } = require('./database/pool');
const { ensureDatabase } = require('./database/bootstrap');
const { initSchema } = require('./database/initSchema');

async function run() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- user@example.com');
    process.exit(1);
  }

  await ensureDatabase();
  await initSchema();

  const [rows] = await pool.query(
    'SELECT id, username, email, is_admin FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (rows.length === 0) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  const user = rows[0];
  if (Number(user.is_admin) === 1) {
    console.log(`User ${user.username} (${user.email}) is already admin.`);
    process.exit(0);
  }

  await pool.query('UPDATE users SET is_admin = 1 WHERE id = ?', [user.id]);
  console.log(`User ${user.username} (${user.email}) is now admin.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
