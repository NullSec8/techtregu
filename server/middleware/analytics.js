const fs = require('fs');
const path = require('path');

const ANALYTICS_LOG = path.join(__dirname, '..', 'analytics.log');

function ensureAnalyticsFile() {
  if (!fs.existsSync(ANALYTICS_LOG)) {
    fs.writeFileSync(ANALYTICS_LOG, '');
  }
}

const ANALYTICS_EVENTS = new Set([
  'page_view',
  'listing_view',
  'listing_create',
  'user_register',
  'message_sent',
  'search',
  'favorite_add',
  'favorite_remove',
]);

function sanitizeEvent(event) {
  if (!event || typeof event !== 'string') return null;
  return event.replace(/[^\w_-]/gi, '').slice(0, 64);
}

function sanitizeValue(value) {
  if (!value || typeof value !== 'string') return '';
  return value.slice(0, 512);
}

const analytics = (req, res, next) => {
  req.analytics = {
    track: (event, data = {}) => {
      if (!ANALYTICS_EVENTS.has(event)) return;
      
      ensureAnalyticsFile();
      
      const entry = {
        t: Date.now(),
        e: sanitizeEvent(event),
        u: req.user?.id || req.ip || 'anon',
        p: sanitizeValue(req.path),
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, sanitizeValue(String(v))])
        ),
      };
      
      fs.appendFileSync(ANALYTICS_LOG, JSON.stringify(entry) + '\n');
    },
  };
  
  next();
};

module.exports = { analytics };