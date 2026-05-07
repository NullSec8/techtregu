const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userRepository = require('../database/userRepository');

function jwtSecret() {
  return process.env.JWT_SECRET;
}

const onlineUsers = new Set();

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
    const userId = socket.userId;
    
    onlineUsers.add(userId);
    io.emit('online', [...onlineUsers]);
    
    socket.join(String(userId));
    socket.on('join', (requestedUserId) => {
      if (String(requestedUserId) !== String(userId)) {
        return;
      }
      socket.join(String(userId));
    });

    socket.on('typing', ({ toUserId, isTyping }) => {
      io.to(String(toUserId)).emit('typing', { userId, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('online', [...onlineUsers]);
    });
  });
}

module.exports = { attachSocketAuth };