import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../context/I18nProvider';

export function Lightbox({ open, images, index, title, onClose, onPrev, onNext }) {
  const { t } = useI18n();

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!images?.length) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lightbox"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('imageViewer')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={onClose}
            aria-label={t('close')}
          >
            &times;
          </button>

          <div className="lightbox-counter">
            {index + 1} {t('of')} {images.length}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              aria-label={t('prevImage')}
            >
              &lsaquo;
            </button>
          )}

          <motion.img
            key={index}
            src={images[index]}
            alt={`${title} — ${t('imageViewer')}`}
            className="lightbox-img"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              aria-label={t('nextImage')}
            >
              &rsaquo;
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
