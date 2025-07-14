import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from '../Components/ProductCard';
import './Catalog.css';


function Catalog({ location }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    async function fetchProducts() {
      const querySnapshot = await getDocs(collection(db, `locations/${location}/products`));
      const items = [];
      querySnapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }
    fetchProducts();
  }, [location]);

  const filtered = category === 'all'
    ? products
    : products.filter(p => p.category === category);

  return (
  <div className="catalog">
    <div className="catalog-categories">
      <button className={`catalog-categories-button ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>Все</button>
      <button className={`catalog-categories-button ${category === 'drinks' ? 'active' : ''}`} onClick={() => setCategory('drinks')}>Напитки</button>
      <button className={`catalog-categories-button ${category === 'desserts' ? 'active' : ''}`} onClick={() => setCategory('desserts')}>Закуски</button>
      <button className={`catalog-categories-button ${category === 'food' ? 'active' : ''}`} onClick={() => setCategory('food')}>Еда</button>
    </div>
    <div className="catalog-list-outer">
      <div className="catalog-list">
        {filtered.map(product => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </div>
  </div>
);
}

export default Catalog;