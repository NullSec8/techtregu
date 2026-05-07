import React, { useCallback, useRef, useState } from 'react';
import { useI18n } from '../context/I18nProvider';

/* ─── helpers ─────────────────────────────────────────────────────────── */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
          });
          resolve({ file: compressed, preview: reader.result, width: w, height: h });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    reader.readAsDataURL(file);
  });
}

function applyTransform(file, rotation, flipH) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const needsSwap = rotation % 180 !== 0;
      canvas.width = needsSwap ? img.naturalHeight : img.naturalWidth;
      canvas.height = needsSwap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    reader.readAsDataURL(file);
  });
}

/* ─── upload helper with progress ─────────────────────────────────────── */

function uploadWithProgress(file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('images', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.urls?.[0] || null);
        } catch {
          reject(new Error('Upload response parse failed'));
        }
      } else {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('POST', '/api/listings/images');
    if (token) xhr.setRequestHeader('X-XSRF-TOKEN', token);
    xhr.withCredentials = true;
    xhr.send(fd);
  });
}

/* ─── Crop/Rotate modal ──────────────────────────────────────────────── */

function CropModal({ preview, onApply, onCancel, t }) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);

  const transform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label={t('editImage') || 'Edit image'}>
      <div className="crop-dialog">
        <h3>{t('editImage') || 'Edit image'}</h3>
        <div className="crop-preview-wrap">
          <img src={preview} alt="" style={{ transform, transition: 'transform 0.2s ease' }} />
        </div>
        <div className="crop-controls">
          <button type="button" className="btn btn-sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
            ↻ {t('rotate') || 'Rotate'}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setFlipH((f) => !f)}>
            ↔ {t('flip') || 'Flip'}
          </button>
        </div>
        <div className="crop-actions">
          <button type="button" className="btn btn-primary" onClick={() => onApply(rotation, flipH)}>
            {t('apply') || 'Apply'}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────── */

export function ImageUploader({ value = [], onChange, maxFiles = 8, token }) {
  const { t } = useI18n();
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(null); // { idx, preview, file }
  const [dragIdx, setDragIdx] = useState(null);
  const fileRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  /* ── add files ──────────────────────────────────────────────────── */

  async function addFiles(files) {
    const current = valueRef.current;
    const remaining = maxFiles - current.length;
    if (remaining <= 0) return;

    const selected = [...files].slice(0, remaining).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (!selected.length) return;

    const newItems = [];
    for (const file of selected) {
      const { file: compressed, preview, width, height } = await compressImage(file);
      const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      newItems.push({ id, file: compressed, preview, progress: 0, done: false, width, height, error: null });
    }
    onChange([...current, ...newItems]);

    // upload each sequentially
    for (const entry of newItems) {
      try {
        await uploadWithProgress(
          entry.file,
          token,
          (pct) => {
            onChange((prev) =>
              prev.map((item) => (item.id === entry.id ? { ...item, progress: pct } : item))
            );
          }
        );
        // mark done — the server returns a URL, but we don't capture it here
        // because the component just stores {preview, file} pairs
        onChange((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, progress: 100, done: true } : item))
        );
      } catch (err) {
        onChange((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, error: err.message, progress: 0 } : item))
        );
      }
    }
  }

  /* ── drag & drop ────────────────────────────────────────────────── */

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  /* ── reorder ────────────────────────────────────────────────────── */

  function handleDragOverItem(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const prev = valueRef.current;
    const arr = [...prev];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, moved);
    setDragIdx(idx);
    onChange(arr);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  /* ── remove / edit ──────────────────────────────────────────────── */

  function remove(idx) {
    onChange(valueRef.current.filter((_, i) => i !== idx));
  }

  function startEdit(idx) {
    const entry = valueRef.current[idx];
    if (entry.file) setEditing({ idx, preview: entry.preview, file: entry.file });
  }

  async function handleEditApply(rotation, flipH) {
    if (!editing) return;
    const transformed = await applyTransform(editing.file, rotation, flipH);
    const { file: compressed, preview, width, height } = await compressImage(transformed);

    onChange((prev) =>
      prev.map((p, i) =>
        i === editing.idx
          ? { ...p, file: compressed, preview, width, height, progress: 0, done: false, error: null }
          : p
      )
    );

    const entry = valueRef.current[editing.idx];
    setEditing(null);

    try {
      await uploadWithProgress(
        compressed,
        token,
        (pct) => {
          onChange((prev) =>
            prev.map((item) => (item.id === entry.id ? { ...item, progress: pct } : item))
          );
        }
      );
      onChange((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, progress: 100, done: true } : item))
      );
    } catch (err) {
      onChange((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, error: err.message, progress: 0 } : item))
      );
    }
  }

  /* ── extract URLs for listing submit ────────────────────────────── */

  // Expose a getter so parent can extract uploaded URLs
  const getUrls = useCallback(() => {
    return valueRef.current
      .map((e) => (typeof e === 'string' ? e : e.url))
      .filter(Boolean);
  }, []);

  const getPreviews = useCallback(() => {
    return valueRef.current.map((e) => (typeof e === 'string' ? e : e.preview));
  }, []);

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <div className="image-uploader">
      {/* drop zone */}
      <div
        className={`drop-zone${dragOver ? ' drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
        aria-label={t('dropImages') || 'Drop images here or click to upload'}
      >
        <div className="drop-icon" aria-hidden="true">📁</div>
        <p className="drop-text">{t('dropImages') || 'Drop images here or click to upload'}</p>
        <p className="drop-hint">
          {t('maxImages') || 'Max'} {maxFiles} · {t('maxSize') || '2MB each'} · JPEG, PNG, WebP, GIF, AVIF
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="drop-file-input"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* preview grid */}
      {value.length > 0 && (
        <div className="preview-grid">
          {value.map((entry, idx) => {
            const isUploading = typeof entry !== 'string' && entry.progress < 100 && !entry.error;
            const isError = typeof entry !== 'string' && entry.error;
            const isDraggable = typeof entry !== 'string';
            return (
              <div
                key={entry.id || `img-${idx}`}
                className={`preview-thumb${dragIdx === idx ? ' dragging' : ''}${isError ? ' has-error' : ''}`}
                draggable={isDraggable}
                onDragStart={() => isDraggable && setDragIdx(idx)}
                onDragOver={(e) => isDraggable && handleDragOverItem(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <img src={typeof entry === 'string' ? entry : entry.preview} alt={`Preview ${idx + 1}`} />
                {/* progress bar */}
                {isUploading && (
                  <div className="preview-progress-bar">
                    <div className="preview-progress-fill" style={{ width: `${entry.progress}%` }} />
                  </div>
                )}
                {/* error badge */}
                {isError && <span className="preview-error-badge" title={entry.error}>!</span>}
                {/* action buttons */}
                <div className="preview-thumb-actions">
                  {typeof entry !== 'string' && entry.file && (
                    <button
                      type="button"
                      className="thumb-btn thumb-edit"
                      onClick={(e) => { e.stopPropagation(); startEdit(idx); }}
                      aria-label={t('editImage') || 'Edit'}
                    >
                      ✎
                    </button>
                  )}
                  <button
                    type="button"
                    className="thumb-btn thumb-remove"
                    onClick={(e) => { e.stopPropagation(); remove(idx); }}
                    aria-label={t('removeImage') || 'Remove'}
                  >
                    ×
                  </button>
                </div>
                {/* drag grip */}
                {isDraggable && (
                  <div className="thumb-grip" title={t('dragToReorder') || 'Drag to reorder'} aria-hidden="true">⠿</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* crop/rotate modal */}
      {editing && (
        <CropModal
          preview={editing.preview}
          t={t}
          onApply={handleEditApply}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
