const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userRepository = require('../database/userRepository');

function jwtSecret() {
  return process.env.JWT_SECRET;
}

/**
 * Socket.IO: only allow joining your own user room; JWT from handshake.auth.token or httpOnly cookie.
 * Also fetches isAdmin flag from database.
 */
function attachSocketAuth(io) {
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token;
    const rawCookie = socket.handshake.headers?.cookie;
    if (!token && rawCookie) {
      const cookies = cookie.parse(rawCookie);
      token = cookies.tt_token;
    }
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, jwtSecret());
      const u = decoded.user || decoded;
      const id = Number(u.id);
      if (Number.isNaN(id)) {
        return next(new Error('Authentication error'));
      }
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new Error('Authentication error'));
      }
      socket.userId = id;
      socket.isAdmin = !!user.is_admin;
      return next();
    } catch {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(String(socket.userId));
    socket.on('join', (requestedUserId) => {
      if (String(requestedUserId) !== String(socket.userId)) {
        return;
      }
      socket.join(String(socket.userId));
    });
  });
}

module.exports = { attachSocketAuth };