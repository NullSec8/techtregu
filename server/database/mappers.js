function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapUser(row, { includeEmail = false } = {}) {
  if (!row) return null;
  const u = {
    id: row.id,
    _id: String(row.id),
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    location: row.location,
    avatar: row.avatar || '',
    age: row.age,
    isAdmin: !!row.is_admin,
    isVerified: !!row.is_verified,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
  if (includeEmail) u.email = row.email;
  return u;
}

/** Maps listing row from JOIN with users (seller_* or plain user columns). */
function mapListing(row) {
  if (!row) return null;
  const images = parseJson(row.images, []);
  const specs = parseJson(row.specs, {});
  const sellerId = row.seller_uid ?? row.seller_id;
  const seller = {
    id: sellerId,
    _id: String(sellerId),
    username: row.seller_username ?? row.username,
    firstName: row.seller_first_name ?? row.first_name,
    lastName: row.seller_last_name ?? row.last_name,
    avatar: row.seller_avatar ?? row.avatar ?? '',
    location: row.seller_location ?? row.location,
    name:
      [row.seller_first_name ?? row.first_name, row.seller_last_name ?? row.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || (row.seller_username ?? row.username),
  };

  return {
    id: row.id,
    _id: String(row.id),
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    condition: row.condition,
    images: Array.isArray(images) ? images : [],
    location: row.location,
    seller_id: row.seller_id,
    seller,
    isActive: !!row.is_active,
    isSold: !!row.is_sold,
    views: row.views ?? 0,
    specs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row) {
  if (!row) return null;
  const listing =
    row.listing_id && row.listing_title != null
      ? {
          id: row.listing_id,
          _id: String(row.listing_id),
          title: row.listing_title,
          images: Array.isArray(row.listing_images)
            ? row.listing_images
            : parseJson(row.listing_images, []),
        }
      : row.listing_id
        ? { id: row.listing_id, _id: String(row.listing_id) }
        : undefined;

  return {
    id: row.id,
    _id: String(row.id),
    sender: row.sender_username
      ? {
          id: row.sender_uid,
          username: row.sender_username,
          firstName: row.sender_first_name,
          lastName: row.sender_last_name,
          avatar: row.sender_avatar,
        }
      : { id: row.sender_id },
    receiver: row.receiver_username
      ? {
          id: row.receiver_uid,
          username: row.receiver_username,
          firstName: row.receiver_first_name,
          lastName: row.receiver_last_name,
          avatar: row.receiver_avatar,
        }
      : { id: row.receiver_id },
    listing,
    content: row.content,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
}

module.exports = { mapUser, mapListing, mapMessage, parseJson };
