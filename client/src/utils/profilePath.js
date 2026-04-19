export function profilePath(userLike) {
  if (!userLike) return '/profile';
  const username = String(userLike.username || '').trim();
  if (username) return `/profile/${encodeURIComponent(username)}`;
  const id = userLike.id ?? userLike._id ?? '';
  return `/profile/${id}`;
}