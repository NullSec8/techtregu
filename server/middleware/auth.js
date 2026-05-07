const jwt = require('jsonwebtoken');
const userRepository = require('../database/userRepository');

const TOKEN_COOKIE = 'tt_token';

const auth = async (req, res, next) => {
  const header = req.header('Authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer || req.cookies?.[TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const u = decoded.user || decoded;
    const id = Number(u.id);
    if (Number.isNaN(id)) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Token version check — reject if stale
    if (u.tokenVersion !== undefined) {
      const version = await userRepository.getTokenVersion(id);
      if (version === null || u.tokenVersion !== version) {
        return res.status(401).json({ message: 'Token has been revoked' });
      }
    }

    req.user = { id, isAdmin: !!u.isAdmin };
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
