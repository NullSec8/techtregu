const { pool } = require('./pool');

async function upsertReview({ sellerId, reviewerId, listingId, rating, comment }) {
  await pool.query(
    `INSERT INTO seller_reviews (seller_id, reviewer_id, listing_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       listing_id = VALUES(listing_id),
       rating = VALUES(rating),
       comment = VALUES(comment),
       updated_at = CURRENT_TIMESTAMP`,
    [sellerId, reviewerId, listingId || null, rating, comment || '']
  );
}

async function getSellerSummary(sellerId) {
  const [[row]] = await pool.query(
    `SELECT
      COUNT(*) AS totalReviews,
      ROUND(AVG(rating), 2) AS averageRating
    FROM seller_reviews
    WHERE seller_id = ?`,
    [sellerId]
  );
  return {
    sellerId: Number(sellerId),
    totalReviews: Number(row?.totalReviews || 0),
    averageRating: row?.averageRating != null ? Number(row.averageRating) : null,
  };
}

async function getLatestReviews(sellerId, limit = 5) {
  const lim = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const [rows] = await pool.query(
    `SELECT
      r.id, r.rating, r.comment, r.created_at,
      u.id AS reviewer_id, u.username AS reviewer_username
     FROM seller_reviews r
     INNER JOIN users u ON u.id = r.reviewer_id
     WHERE r.seller_id = ?
     ORDER BY r.updated_at DESC
     LIMIT ?`,
    [sellerId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    rating: Number(r.rating),
    comment: r.comment || '',
    createdAt: r.created_at,
    reviewer: {
      id: r.reviewer_id,
      username: r.reviewer_username,
    },
  }));
}

module.exports = {
  upsertReview,
  getSellerSummary,
  getLatestReviews,
};
