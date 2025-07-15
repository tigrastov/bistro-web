import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

import { db } from '../firebase';
import './DetailView.css';

function DetailView({ location, userData, setCartCount }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Проверяем, админ ли текущий пользователь
  const isAdmin = userData?.role === 'adminCuba' || userData?.role === 'adminKarlMarks';

  useEffect(() => {
    async function fetchProduct() {
      try {
        const ref = doc(db, `locations/${location}/products`, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        } else {
          setProduct(null);
        }
      } catch (e) {
        console.error(e);
        setProduct(null);
      }
    }

    if (location && id) {
      fetchProduct();
    }
  }, [id, location]);

  const handleDeleteProduct = async () => {
    try {
      const ref = doc(db, `locations/${location}/products`, id);
      await deleteDoc(ref);
      setProduct(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  const existingIndex = cart.findIndex(item => item.id === product.id);
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += Number(quantity);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: Number(quantity),
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  // 👉 Обновляем бейдж
  if (setCartCount) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  }
};

  if (!product) {
    return (
      <div className="detail-loading">
        <Link to="/" className="back-to-catalog-button">В каталог товаров</Link>
      </div>
    );
  }

  return (
    <div className="detail-page no-header">
      

      <div className="detail-view">
        {product.photo && (
          <div className="detail-photo-wrap">
            <img src={product.photo} alt={product.name} className="detail-photo" />
          </div>
        )}

        <h2 className="detail-title">{product.name}</h2>
        <div className="detail-price">{product.price} ₽</div>
       

        {isAdmin ? (
          <div className="admin-actions">
            <button className="delete-button" onClick={handleDeleteProduct}>
              Удалить товар
            </button>
          </div>
        ) : (
          <div className="add-to-cart-container">

            {/* <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            /> */}

            {/* <div className="quantity-control">
  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>−</button>
  <span>{quantity}</span>
  <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
</div> */}
           

           <div className="quantity-control">
  <label className="quantity-label">Количество:</label>
  <div className="quantity-buttons">
    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>−</button>
    <span>{quantity}</span>
    <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
  </div>
</div>


            <Link to="/" replace>
  <button className="add-to-cart-button" onClick={handleAddToCart}>
    Добавить в корзину
  </button>
</Link>

     <Link to="/" replace>
  <button className="back-to-catalog-button" >
    Вернуться в каталог 
  </button>
</Link>

            <span className="price">Цена: {product.price * quantity} ₽</span>
          </div>
        )}
          <div className="detail-desc">{product.desc}</div>
       
      </div>
    </div>
  );
}

export default DetailView;