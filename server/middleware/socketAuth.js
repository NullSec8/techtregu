const cookie = require('cookie');
const jwt = require('jsonwebtoken');

function jwtSecret() {
  return process.env.JWT_SECRET || 'your_jwt_secret';
}

/**
 * Socket.IO: only allow joining your own user room; JWT from handshake.auth.token or httpOnly cookie.
 */
function attachSocketAuth(io) {
  io.use((socket, next) => {
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
      socket.userId = id;
      return next();
    } catch {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (requestedUserId) => {
      if (String(requestedUserId) !== String(socket.userId)) {
        return;
      }
      socket.join(String(socket.userId));
    });
  });
}

module.exports = { attachSocketAuth };
