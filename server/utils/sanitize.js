const sanitizeHtml = require('sanitize-html');

const PLAIN = {
  allowedTags: [],
  allowedAttributes: {},
};

/** Strip HTML; keep plain text for descriptions, messages, etc. */
function plainText(input, maxLen = 20000) {
  if (input == null) return '';
  const s = String(input);
  const stripped = sanitizeHtml(s, PLAIN).trim();
  if (stripped.length > maxLen) return stripped.slice(0, maxLen);
  return stripped;
}

/** Sanitize listing.specs string values (category templates). */
function sanitizeSpecs(specs) {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return {};
  const out = {};
  for (const [k, v] of Object.entries(specs)) {
    const key = plainText(k, 64);
    if (!key) continue;
    out[key] = plainText(v, 500);
  }
  return out;
}

module.exports = { plainText, sanitizeSpecs };
