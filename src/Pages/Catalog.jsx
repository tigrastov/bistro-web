import { useEffect, useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from '../Components/ProductCard';
import './Catalog.css';


function Catalog({ location, cartCount, hasOrders }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const navigate = useNavigate();

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
        <button className={`catalog-categories-button ${category === 'combo' ? 'active' : ''}`} onClick={() => setCategory('combo')}>Комбо</button>
        <button className={`catalog-categories-button ${category === 'burgers' ? 'active' : ''}`} onClick={() => setCategory('burgers')}>Бургеры</button>
        <button className={`catalog-categories-button ${category === 'shawarma' ? 'active' : ''}`} onClick={() => setCategory('shawarma')}>Шаурма</button>
        <button className={`catalog-categories-button ${category === 'hot-dogs' ? 'active' : ''}`} onClick={() => setCategory('hot-dogs')}>Хот-Доги</button>
        <button className={`catalog-categories-button ${category === 'french-fries' ? 'active' : ''}`} onClick={() => setCategory('french-fries')}>Картофель</button>
        <button className={`catalog-categories-button ${category === 'drinks' ? 'active' : ''}`} onClick={() => setCategory('drinks')}>Напитки</button>
        <button className={`catalog-categories-button ${category === 'appetizers' ? 'active' : ''}`} onClick={() => setCategory('appetizers')}>Закуски</button>
        <button className={`catalog-categories-button ${category === 'desserts' ? 'active' : ''}`} onClick={() => setCategory('desserts')}>Десерты</button>
        <button className={`catalog-categories-button ${category === 'sauces' ? 'active' : ''}`} onClick={() => setCategory('sauces')}>Соусы</button>
        <button className={`catalog-categories-button ${category === 'additionally' ? 'active' : ''}`} onClick={() => setCategory('additionally')}>Дополнительно</button>
        <button className={`catalog-categories-button ${category === 'new' ? 'active' : ''}`} onClick={() => setCategory('new')}>Новинки</button>
      </div>
      <div className="catalog-list-outer">
        <div className="catalog-list">
          {filtered.map(product => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
      {cartCount > 0 && (
        <motion.div
          className="mini-cart"
          onClick={() => navigate('/cart')}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
        >
          🛒 {cartCount}
        </motion.div>
      )}

       {hasOrders && (
        <motion.div
          className="mini-orders"
          onClick={() => navigate('/orders')}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
        >
          🛍️
        </motion.div>
      )}
    </div>
  );
}

export default Catalog;




