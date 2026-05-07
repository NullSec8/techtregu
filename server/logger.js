const fs = require('fs');
const crypto = require('crypto');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

let fileStream = null;
if (process.env.LOG_FILE) {
  fileStream = fs.createWriteStream(process.env.LOG_FILE, { flags: 'a' });
}

function log(level, message, meta = {}) {
  const levelNum = LEVELS[level];
  if (levelNum === undefined || levelNum < CURRENT_LEVEL) return;

  const entry = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...meta,
  };

  const line = JSON.stringify(entry) + '\n';

  if (level === 'error' || level === 'fatal') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  if (fileStream) {
    fileStream.write(line);
  }
}

function requestLogger(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  next();
}

module.exports = { log, requestLogger };
