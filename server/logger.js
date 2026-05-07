const fs = require('fs');
const crypto = require('crypto');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

let fileStream = null;
if (process.env.LOG_FILE) {
  fileStream = fs.createWriteStream(process.env.LOG_FILE, { flags: 'a' });
}

/**
 * Replaces PII (email addresses, IP addresses, phone numbers) in a string with [REDACTED].
 * @param {string} text - The text to redact.
 * @returns {string} The redacted text.
 */
function redactPii(text) {
  if (typeof text !== 'string') return text;

  // Email addresses
  const emailRegex = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi;
  // IPv4 addresses
  const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  // Phone numbers (common formats)
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;

  return text.replace(emailRegex, '[REDACTED]')
             .replace(ipv4Regex, '[REDACTED]')
             .replace(phoneRegex, '[REDACTED]');
}

/**
 * Recursively redacts PII from all string values in an object.
 * Keys are preserved; only values are redacted.
 * @param {object} obj - The object to redact values in.
 * @returns {object} A new object with redacted string values.
 */
function redactObjectValues(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const result = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      result[key] = redactPii(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObjectValues(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function log(level, message, meta = {}) {
  const levelNum = LEVELS[level];
  if (levelNum === undefined || levelNum < CURRENT_LEVEL) return;

  const entry = {
    level,
    msg: redactPii(message),
    ts: new Date().toISOString(),
    ...redactObjectValues(meta),
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
