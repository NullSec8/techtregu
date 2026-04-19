const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  },
});

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 2 * 1024 * 1024;
const MAX_FILES = Number(process.env.MAX_UPLOAD_FILES) || 8;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !/^image\/(jpeg|png|gif|webp|avif)$/i.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, WebP, and AVIF images are allowed'));
    }
    cb(null, true);
  },
});

module.exports = { upload, uploadsDir, MAX_FILE_SIZE, MAX_FILES };