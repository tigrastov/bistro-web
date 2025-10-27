
import { Link } from 'react-router-dom';    
import './ProductCard.css';

function ProductCard({ product }) {
  return (
    <Link to ={`/product/${product.id}`} className="catalog-item-link">
<div className={`catalog-item ${product.paused ? 'paused' : ''}`}>
      {product.photo && <img src={product.photo} alt={product.name} />}
      <h2>{product.name}</h2>
      <div className="price">{product.price} ₽</div>

       {product.paused ? (
         <div className="desc paused-label">Временно недоступен</div>
       ) : (
         <div className="desc">Подробнее о товаре</div>
       )}
    </div>
    </Link>
    
  );
}

export default ProductCard;