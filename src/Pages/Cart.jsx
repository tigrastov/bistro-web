import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import './Cart.css';
import ConfirmModal from './ConfirmModal';
import PaymentHandler from '../Components/PaymentHandler';



function Cart({ setCartCount }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const removeItem = (id) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
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

  // ⚡️ заказ сохраняется локально, пока не оплачено
  const sendOrder = async () => {
    if (!user) {
      alert('Вы должны авторизоваться, чтобы оформить заказ');
      navigate('/auth');
      return;
    }

    const location = localStorage.getItem('location');
    if (!location) {
      alert('Локация не выбрана');
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    const userData = userSnap.data();
    const total = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const order = {
      totalAmount: total,
      status: 'ожидает оплаты',
      clientEmail: userData.email || '',
      clientName: userData.name,
      userId: user.uid,
      userPhone: userData.phone,
      items: cartItems,
      location,
    };

    // сохраняем заказ в состоянии и localStorage, чтобы Success.js мог его прочитать
    setCurrentOrder(order);
    localStorage.setItem('currentOrder', JSON.stringify(order));

    setIsModalOpen(false);
    setShowPayment(true);
  };

  // ✅ успешная оплата → заказ в Firestore
  const handlePaymentSuccess = async () => {
    // После внедрения вебхука заказ обновляется сервером, здесь просто очистка
    clearCart();
    setShowPayment(false);
    setCurrentOrder(null);
    alert('Оплата успешно проведена. Заказ сохранён.');
  };

  const handlePaymentError = (error) => {
    console.error('Ошибка платежа:', error);
    alert('Произошла ошибка при оплате. Попробуйте еще раз.');
  };

  if (showPayment && currentOrder) {
    return (
      <div className="cart-page">
        <div className="cart">
          <h1>Оплата заказа</h1>
          <PaymentHandler
            order={currentOrder}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart">
        <h1>Корзина</h1>
        {cartItems.length === 0 ? (
          <p>Корзина пуста</p>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="left-space" />
                  <span>{item.quantity}</span>
                  <span>{item.name}</span>
                  <span className="nowrap">{item.price * item.quantity} ₽</span>
                  <button className="remove-item-btn" onClick={() => removeItem(item.id)}>
                    Удалить
                  </button>
                </li>
              ))}
            </ul>

            <p className="cart-total">
              Общая стоимость:{' '}
              {cartItems.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              )}{' '}
              ₽
            </p>

            <button onClick={clearCart} className="clear-cart-btn">
              Очистить корзину
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="checkout-btn"
            >
              Оформить заказ
            </button>

            {isModalOpen && (
              <ConfirmModal
                title={`Подтвердить оформление заказа ?`}
                onConfirm={sendOrder}
                onCancel={() => setIsModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;