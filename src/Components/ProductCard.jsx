
import { Link } from 'react-router-dom';    
import './ProductCard.css';

function ProductCard({ product }) {
  return (
    <Link to ={`/products/${product.id}`} className="catalog-item-link">
<div className="catalog-item">
      {product.photo && <img src={product.photo} alt={product.name} />}
      <h2>{product.name}</h2>
      <div className="price">{product.price} ₽</div>
      <div className="desc">{product.desc}</div>
    </div>
    </Link>
    
  );
}

export default ProductCard;