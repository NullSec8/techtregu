const { pool } = require('./pool');

async function addFavorite(userId, listingId) {
  const [result] = await pool.query(
    `INSERT INTO user_favorites (user_id, listing_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE created_at = created_at`,
    [userId, listingId]
  );
  return result.affectedRows > 0;
}

async function removeFavorite(userId, listingId) {
  const [r] = await pool.query(
    'DELETE FROM user_favorites WHERE user_id = ? AND listing_id = ?',
    [userId, listingId]
  );
  return r.affectedRows > 0;
}

async function isFavorite(userId, listingId) {
  const [rows] = await pool.query(
    'SELECT id FROM user_favorites WHERE user_id = ? AND listing_id = ?',
    [userId, listingId]
  );
  return rows.length > 0;
}

async function getUserFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT f.listing_id, l.title, l.price, l.images, l.category, l.condition, l.location,
            l.is_active, l.created_at
     FROM user_favorites f
     INNER JOIN listings l ON l.id = f.listing_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.listing_id,
    title: r.title,
    price: Number(r.price),
    images: typeof r.images === 'object' ? r.images : JSON.parse(r.images || '[]'),
    category: r.category,
    condition: r.condition,
    location: r.location,
    isActive: !!r.is_active,
    createdAt: r.created_at,
  }));
}

async function getFavoriteIds(userId) {
  const [rows] = await pool.query(
    'SELECT listing_id FROM user_favorites WHERE user_id = ?',
    [userId]
  );
  return rows.map((r) => Number(r.listing_id));
}

module.exports = {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  getFavoriteIds,
};