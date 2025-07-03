import './ProductCard.css';

function ProductCard({ product }) {
  return (
    <div className="catalog-item">
      {product.photo && <img src={product.photo} alt={product.name} />}
      <h2>{product.name}</h2>
      <div className="price">{product.price} ₽</div>
      <div className="desc">{product.desc}</div>
    </div>
  );
}

export default ProductCard;