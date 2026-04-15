const { pool } = require('./pool');
const { mapListing } = require('./mappers');

const SELLER_JOIN = `
  l.id, l.title, l.description, l.price, l.category, l.condition, l.images, l.location,
  l.seller_id, l.is_active, l.views, l.specs, l.created_at, l.updated_at,
  u.id AS seller_uid, u.username AS seller_username, u.first_name AS seller_first_name,
  u.last_name AS seller_last_name, u.email AS seller_email, u.phone AS seller_phone,
  u.avatar AS seller_avatar, u.location AS seller_location
`;

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SELLER_JOIN}
     FROM listings l
     INNER JOIN users u ON u.id = l.seller_id
     WHERE l.id = ? AND l.is_active = 1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return mapListing(row);
}

async function findMany(filters) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    condition,
    location,
    page = 1,
    limit = 12,
  } = filters;

  const where = ['l.is_active = 1'];
  const params = [];

  if (category && category !== 'all') {
    where.push('l.category = ?');
    params.push(category);
  }

  if (search) {
    where.push('(l.title LIKE ? OR l.description LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q);
  }

  if (minPrice != null && minPrice !== '') {
    where.push('l.price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice != null && maxPrice !== '') {
    where.push('l.price <= ?');
    params.push(Number(maxPrice));
  }

  if (condition) {
    where.push('l.condition = ?');
    params.push(condition);
  }

  if (location) {
    where.push('l.location LIKE ?');
    params.push(`%${location}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Math.min(Math.max(Number(limit) || 12, 1), 100);
  const pg = Math.max(Number(page) || 1, 1);
  const offset = (pg - 1) * lim;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM listings l ${whereSql}`,
    params
  );
  const total = countRows[0].c;

  const [rows] = await pool.query(
    `SELECT ${SELLER_JOIN}
     FROM listings l
     INNER JOIN users u ON u.id = l.seller_id
     ${whereSql}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );

  const listings = rows.map((row) => mapListing(row));

  return { listings, total, page: pg, limit: lim };
}

async function create(data) {
  const imagesJson = JSON.stringify(data.images || []);
  const specsJson = JSON.stringify(data.specs || {});

  const [result] = await pool.query(
    `INSERT INTO listings (title, description, price, category, \`condition\`, images, location, seller_id, specs)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description,
      data.price,
      data.category,
      data.condition,
      imagesJson,
      data.location,
      data.sellerId,
      specsJson,
    ]
  );
  return findById(result.insertId);
}

async function findByIdRaw(id) {
  const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [id]);
  return rows[0] || null;
}

async function update(id, sellerId, patch, options = {}) {
  const { isAdmin = false } = options;
  const row = await findByIdRaw(id);
  if (!row || (!isAdmin && row.seller_id !== sellerId)) return null;

  const fields = [];
  const vals = [];

  if (patch.title !== undefined) {
    fields.push('title = ?');
    vals.push(patch.title);
  }
  if (patch.description !== undefined) {
    fields.push('description = ?');
    vals.push(patch.description);
  }
  if (patch.price !== undefined) {
    fields.push('price = ?');
    vals.push(patch.price);
  }
  if (patch.category !== undefined) {
    fields.push('category = ?');
    vals.push(patch.category);
  }
  if (patch.condition !== undefined) {
    fields.push('`condition` = ?');
    vals.push(patch.condition);
  }
  if (patch.location !== undefined) {
    fields.push('location = ?');
    vals.push(patch.location);
  }
  if (patch.isActive !== undefined) {
    fields.push('is_active = ?');
    vals.push(patch.isActive ? 1 : 0);
  }
  if (patch.images !== undefined) {
    fields.push('images = ?');
    vals.push(JSON.stringify(patch.images));
  }
  if (patch.specs !== undefined) {
    fields.push('specs = ?');
    vals.push(JSON.stringify(patch.specs));
  }
  if (!fields.length) return findById(id);

  vals.push(id);
  let sql = `UPDATE listings SET ${fields.join(', ')} WHERE id = ?`;
  if (!isAdmin) {
    vals.push(sellerId);
    sql += ' AND seller_id = ?';
  }
  await pool.query(sql, vals);
  return findById(id);
}

async function remove(id, sellerId, options = {}) {
  const { isAdmin = false } = options;
  const [r] = isAdmin
    ? await pool.query('DELETE FROM listings WHERE id = ?', [id])
    : await pool.query('DELETE FROM listings WHERE id = ? AND seller_id = ?', [id, sellerId]);
  return r.affectedRows > 0;
}

async function incrementViews(id) {
  await pool.query('UPDATE listings SET views = views + 1 WHERE id = ?', [id]);
}

async function findBySeller(sellerId) {
  const [rows] = await pool.query(
    `SELECT ${SELLER_JOIN}
     FROM listings l
     INNER JOIN users u ON u.id = l.seller_id
     WHERE l.seller_id = ? AND l.is_active = 1
     ORDER BY l.created_at DESC`,
    [sellerId]
  );
  return rows.map((row) => mapListing(row));
}

async function findBySellerAll(sellerId) {
  const [rows] = await pool.query(
    `SELECT ${SELLER_JOIN}
     FROM listings l
     INNER JOIN users u ON u.id = l.seller_id
     WHERE l.seller_id = ?
     ORDER BY l.created_at DESC`,
    [sellerId]
  );
  return rows.map((row) => mapListing(row));
}

async function findAllForAdmin({ page = 1, limit = 50, sellerId, active }) {
  const where = [];
  const params = [];
  if (sellerId != null && sellerId !== '') {
    where.push('l.seller_id = ?');
    params.push(Number(sellerId));
  }
  if (active === '0' || active === '1') {
    where.push('l.is_active = ?');
    params.push(Number(active));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const pg = Math.max(Number(page) || 1, 1);
  const offset = (pg - 1) * lim;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS c FROM listings l ${whereSql}`, params);
  const total = countRows[0].c;

  const [rows] = await pool.query(
    `SELECT ${SELLER_JOIN}
     FROM listings l
     INNER JOIN users u ON u.id = l.seller_id
     ${whereSql}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );
  return { listings: rows.map((row) => mapListing(row)), total, page: pg, limit: lim };
}

async function getAdminStats() {
  const [[listingStats]] = await pool.query(
    `SELECT
      COUNT(*) AS totalListings,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeListings,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS hiddenListings,
      SUM(views) AS totalViews
    FROM listings`
  );
  const [[userStats]] = await pool.query(
    `SELECT
      COUNT(*) AS totalUsers,
      SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) AS adminUsers
    FROM users`
  );
  return {
    totalListings: Number(listingStats.totalListings || 0),
    activeListings: Number(listingStats.activeListings || 0),
    hiddenListings: Number(listingStats.hiddenListings || 0),
    totalViews: Number(listingStats.totalViews || 0),
    totalUsers: Number(userStats.totalUsers || 0),
    adminUsers: Number(userStats.adminUsers || 0),
  };
}

module.exports = {
  findById,
  findMany,
  create,
  findByIdRaw,
  update,
  remove,
  incrementViews,
  findBySeller,
  findBySellerAll,
  findAllForAdmin,
  getAdminStats,
};
