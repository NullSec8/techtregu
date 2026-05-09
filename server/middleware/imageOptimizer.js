let sharp;
const { log } = require('../logger');
try {
  sharp = require('sharp');
} catch {
  log('warn', 'sharp_not_available', { hint: 'Install sharp for image optimization' });
}

const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir, { recursive: true });

const OPTIMIZE_FORMATS = process.env.IMAGE_FORMAT === 'webp' ? 'webp' : 'jpeg';
const QUALITY = parseInt(process.env.IMAGE_QUALITY) || 80;
const MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH) || 1920;
const MAX_HEIGHT = parseInt(process.env.IMAGE_MAX_HEIGHT) || 1080;
const GENERATE_THUMBNAILS = process.env.IMAGE_THUMBNAILS !== 'false';

const THUMBNAIL_SIZE = 300;

async function optimizeImage(inputPath, outputPath, options = {}) {
  if (!sharp) {
    fs.copyFileSync(inputPath, outputPath);
    return { saved: false, outputPath };
  }

  const {
    width = MAX_WIDTH,
    height = MAX_HEIGHT,
    quality = QUALITY,
    format = OPTIMIZE_FORMATS,
  } = options;

  try {
    let pipeline = sharp(inputPath);

    const metadata = await pipeline.metadata();
    let resizeW = width;
    let resizeH = height;

    if (metadata.width > width || metadata.height > height) {
      const ratio = Math.min(width / metadata.width, height / metadata.height);
      if (ratio < 1) {
        resizeW = Math.round(metadata.width * ratio);
        resizeH = Math.round(metadata.height * ratio);
      }
    }

    pipeline = pipeline.resize(resizeW, resizeH, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    }

    await pipeline.toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const saved = originalSize - optimizedSize;

    return {
      saved: saved > 0 ? saved : 0,
      outputPath,
      originalSize,
      optimizedSize,
    };
  } catch (err) {
    log('error', 'image_optim_error', { error: err.message });
    fs.copyFileSync(inputPath, outputPath);
    return { saved: false, outputPath };
  }
}

async function generateThumbnails(imagePath) {
  if (!sharp || !GENERATE_THUMBNAILS) return;

  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  const thumbPath = path.join(dir, `${basename}_thumb${ext}`);

  try {
    await sharp(imagePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 70 })
      .toFile(thumbPath);

    return thumbPath;
  } catch (err) {
    log('error', 'thumbnail_error', { error: err.message });
    return null;
  }
}

const imageOptimizer = {
  optimizeImage,
  generateThumbnails,
  config: {
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    quality: QUALITY,
    format: OPTIMIZE_FORMATS,
    thumbnailSize: THUMBNAIL_SIZE,
    sharpAvailable: !!sharp,
  },
};

module.exports = {
  imageOptimizer,
  optimizeImage,
  generateThumbnails,
  imageConfig: imageOptimizer.config,
};