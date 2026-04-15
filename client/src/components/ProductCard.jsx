import { Link } from 'react-router-dom';
import { categoryEmoji, displayCategory } from '../utils/listingUtils';

export function ProductCard({ product }) {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const id = product.id || product._id;

  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="card-media">
        <span className="card-badge">Listed</span>
        {imageUrl ? (
          <img src={imageUrl} alt={product.title} className="card-img" />
        ) : (
          <div className="card-img-placeholder">{categoryEmoji(product.category)}</div>
        )}
      </div>

      <div className="card-body">
        <span className="card-category">{displayCategory(product.category)}</span>
        <h3 className="card-title">{product.title}</h3>
        <p className="card-desc">{product.description.substring(0, 120)}…</p>

        <div className="card-footer">
          <span className="card-price">
            <span>€</span>
            {Number(product.price).toLocaleString()}
          </span>
          <span className="card-seller">
            @{product.seller?.username || product.seller?.name || 'seller'}
          </span>
        </div>
      </div>
    </Link>
  );
}
