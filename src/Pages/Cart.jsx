import { useState, useEffect } from 'react';
import './Cart.css';

function Cart({ setCartCount }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
  }, []);

  const removeItem = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    const newCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(newCount);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCartItems([]);
    setCartCount(0);
  };

  const handleSwipe = (e, index) => {
    const item = e.currentTarget;
    const startX = e.changedTouches[0].clientX;

    const handleTouchEnd = (endEvent) => {
      const endX = endEvent.changedTouches[0].clientX;
      const diff = startX - endX;

      if (diff > 50) {
        item.classList.add('swipe-left');
      } else {
        item.classList.remove('swipe-left');
      }

      item.removeEventListener('touchend', handleTouchEnd);
    };

    item.addEventListener('touchend', handleTouchEnd);
  };

  const handleCheckout = () => {
    alert('Переходим к оформлению заказа');
  };

  return (
    <div className="cart">
      <h1>Корзина</h1>
      {cartItems.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item, index) => (
              <li
                key={item.id}
                className="cart-item"
                onTouchStart={(e) => handleSwipe(e, index)}
              >
                <span>{item.name}</span>
                <span>x {item.quantity}</span>
                <span>{item.price * item.quantity} ₽</span>
                <button
                  className="remove-item-btn"
                  onClick={() => removeItem(item.id)}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>

          <p>
            Общая стоимость:{" "}
            {cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)} ₽
          </p>

          <button onClick={clearCart} className="clear-cart-btn">
            Очистить корзину
          </button>

          <button onClick={handleCheckout} className="checkout-btn">
            Оформить заказ
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;