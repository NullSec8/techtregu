import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { ProductCard } from '../components/ProductCard';
import { useI18n } from '../context/I18nProvider';

export function FavoritesPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('myFavorites')));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/favorites');
        setFavorites(data);
      } catch (e) {
        setError(e.response?.data?.message || e.message || t('error'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, navigate, t]);

  function handleRemove(listingId) {
    setFavorites((prev) => prev.filter((f) => f.id !== listingId));
  }

  if (loading) {
    return (
      <div className="page-favorites">
        <h1>{t('myFavorites')}</h1>
        <p className="loading-text" role="status" aria-live="polite">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-favorites">
      <h1>{t('myFavorites')}</h1>
      <p className="products-sub">{t('favoritesLead')}</p>

      {error ? <div className="banner-error">{error}</div> : null}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>{t('noFavorites')}</p>
          <p>{t('noFavoritesDesc')}</p>
          <p className="empty-actions">
            <Link to="/" className="btn btn-primary">
              {t('browseListings')}
            </Link>
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {favorites.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isFavorite={true}
              onRemoveFavorite={handleRemove}
              showRemove={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
