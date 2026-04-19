.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
}

.lightbox-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.lightbox-prev,
.lightbox-next {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.lightbox-prev:hover,
.lightbox-next:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lightbox-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.detail-img-main {
  cursor: pointer;
}

.detail-img-thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.detail-img-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.2s;
}

.detail-img-thumb:hover {
  opacity: 1;
}

.detail-img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-img-more {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
}