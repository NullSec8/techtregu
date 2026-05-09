import { categoryEmoji } from '../utils/listingUtils';

export function ImageGallery({ images, title, category, onOpenLightbox }) {
  if (!images || images.length === 0) {
    return (
      <div className="detail-img">
        <div className="img-placeholder">{categoryEmoji(category)}</div>
      </div>
    );
  }

  return (
    <div className="detail-img">
      <div
        className="detail-img-main"
        onClick={() => onOpenLightbox(0)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpenLightbox(0); }}
      >
        <img src={images[0]} alt={title} decoding="async" />
      </div>
      {images.length > 1 && (
        <div className="detail-img-thumbnails">
          {images.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="detail-img-thumb"
              onClick={() => onOpenLightbox(i + 1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpenLightbox(i + 1); }}
              aria-label={`View image ${i + 2} of ${images.length}`}
            >
              <img src={img} alt={`Image ${i + 2}: ${title}`} />
            </div>
          ))}
          {images.length > 5 && (
            <div
              className="detail-img-more"
              onClick={() => onOpenLightbox(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpenLightbox(0); }}
              aria-label={`View all ${images.length} images`}
            >
              +{images.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
