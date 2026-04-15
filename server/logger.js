function log(level, msg, meta = {}) {
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = { log };
