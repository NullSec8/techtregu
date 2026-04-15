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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const u = decoded.user || decoded;
    const id = Number(u.id);
    if (Number.isNaN(id)) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    const row = await userRepository.findById(id);
    if (!row) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    req.user = { id, isAdmin: !!row.is_admin };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
