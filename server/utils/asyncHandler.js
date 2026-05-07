const logger = require('../logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.log('error', 'route_error', {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
      });
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ message: err.message || 'Server error' });
    });
  };
}

module.exports = { asyncHandler, AppError };
