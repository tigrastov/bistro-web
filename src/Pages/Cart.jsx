

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkingHours } from '../hooks/useWorkingHours';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import './Cart.css';
import ClosedScreen from '../Components/ClosedScreen';
import ConfirmModal from './ConfirmModal';
import PaymentHandler from '../Components/PaymentHandler';
import { BookOpen } from "lucide-react";
import { Trash } from "lucide-react";

function Cart({ setCartCount, isAdmin, isTerminal, userData, location }) {
  const { isOpen, serverTime } = useWorkingHours({
    open: "10:00",
    close: "21:30",
    timezone: 3
  });
  
  const [isStopDelivery, setIsStopDelivery] = useState(false);
  const [isClosedModal, setIsClosedModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isDelivery, setIsDelivery] = useState(false);
  const [modalStep, setModalStep] = useState(0);

  const navigate = useNavigate();

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  function calculateDelivery(total) {
    if (total >= 1400) return 0;
    if (total >= 1100) return 69;
    if (total >= 900) return 109;
    if (total >= 600) return 159;
    if (total >= 299) return 209;
    if (total <= 299) return null;
    return 0;
  }

  // function calculateDelivery(total) {
  //   if (total >= 2) return 1;

  //   if (total <= 1) return null;
  //   return 0;
  // }
  
   const db = getFirestore();

  // Подписка на stopDelivery для текущей локации
  useEffect(() => {
    if (!location) {
      setIsStopDelivery(false);
      return;
    }

    const locationRef = doc(db, 'locations', location);
    const unsub = onSnapshot(
      locationRef,
      (snap) => {
        const data = snap.data() || {};
        setIsStopDelivery(!!data.stopDelivery);
      },
      (error) => {
        console.error('Ошибка подписки на stopDelivery:', error);
        setIsStopDelivery(false); // при ошибке считаем, что доставка работает
      }
    );

    return () => unsub();
  }, [location, db]);


  const deliveryCost = calculateDelivery(total);
  const finalAmount = total + (deliveryCost || 0);
  const canDeliver = deliveryCost !== null;

  const goToCatalog = () => navigate('/');

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);

    const auth = getAuth();
    return onAuthStateChanged(auth, setUser);
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

  useEffect(() => {
    if (serverTime) {
      console.log("Серверное время Firebase:", serverTime.toLocaleString());
      console.log("Локальное время компьютера:", new Date().toLocaleString());
    }
  }, [serverTime]);

  const prepareOrder = async () => {
    if (!user) {
      alert('Вы должны авторизоваться, чтобы оформить заказ');
      navigate('/auth');
      return;
    }

    const loc = localStorage.getItem('location');
    if (!loc) {
      alert('Локация не выбрана');
      return;
    }
    
     if (isDelivery && isStopDelivery) {
      console.log('isStopDelivery', isStopDelivery);
      return;
    }

    if (!isOpen) {
      setIsClosedModal(true);
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    const uData = userSnap.data();

    const order = {
      totalAmount: total,
      status: 'ожидает оплаты',
      clientEmail: uData.email || '',
      clientName: uData.name,
      userId: user.uid,
      userPhone: uData.phone,
      items: cartItems,
      location: loc,
    };

    setCurrentOrder(order);
    localStorage.setItem('currentOrder', JSON.stringify(order));
    setModalStep(2);
  };

  const handlePaymentSuccess = async () => {
    clearCart();
    setModalStep(0);
    setCurrentOrder(null);
    alert('Оплата успешно проведена. Заказ сохранён.');
  };

  const handlePaymentError = (error) => {
    console.error('Ошибка платежа:', error);
    alert('Произошла ошибка при оплате. Попробуйте еще раз.');
    setModalStep(0);
  };

  return (
    <div className="cart-page">
      <div className="cart">
        <h1>Корзина</h1>

        {cartItems.length === 0 ? (
          <p>Корзина пуста</p>
        ) : (
          <>
            <ul className="cart-list">

              {!isTerminal && (
                <div className='delivery-price'>
                  <p className='price'>Стоимость доставки:</p>
                  <p> от 299 до 599 ₽ - 209 ₽</p>
                  <p> от 600 до 899 ₽ - 159 ₽</p>
                  <p> от 900 до 1099 ₽ - 109 ₽</p>
                  <p> от 1100 до 1399 ₽ - 69 ₽</p>
                  <p> от 1400 ₽ - Бесплатно ₽</p>
                </div>
              )}

              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <div className="left-space" />
                  <span>{item.quantity}</span>
                  <span>{item.name}</span>
                  <span className="nowrap">{item.price * item.quantity} ₽</span>
                  <button className="remove-item-btn" onClick={() => removeItem(item.id)}>Удалить</button>
                </li>
              ))}

              <div>
                <p className="cart-total">
                  Общая стоимость без доставки: {total} ₽
                </p>

                {!isTerminal && (
                  canDeliver ? (
                    <p className="cart-delivery">
                      Стоимость доставки:{" "}
                      {deliveryCost === 0 ? (
                        <strong style={{ color: "green" }}>Бесплатно</strong>
                      ) : (
                        <strong>{deliveryCost} ₽</strong>
                      )}
                    </p>
                  ) : (
                    <p className="cart-delivery">
                      🚫 Доставка доступна только для заказов от 300₽
                    </p>
                  )
                )}

                {canDeliver && !isTerminal && (
                  <p className="cart-final">
                    Итого с доставкой: <strong>{finalAmount} ₽</strong>
                  </p>
                )}
              </div>
            </ul>

            {canDeliver && !isTerminal && (
  <button
    onClick={() => {
      if (isStopDelivery) return; // блокировка клика
      setIsModalOpen(true);
      setIsDelivery(true);
      setModalStep(1);
    }}
    className={`checkout-btn-delivery ${isStopDelivery ? 'disabled-btn' : ''}`}
    disabled={isStopDelivery} // стандартный атрибут disabled
  >
    {isStopDelivery ? (
      <>
        <strong>🚫 Доставка временно недоступна</strong>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          Попробуйте позже
        </div>
      </>
    ) : (
      <>
        <strong>{finalAmount} ₽</strong> - Оформить заказ c доставкой
      </>
    )}
  </button>
)}

            <button
              onClick={() => {
                setIsDelivery(false);
                setIsModalOpen(true);
                setModalStep(1);
              }}
              className="checkout-btn"
            >
              <strong>{total} ₽</strong> {!isTerminal && ' - Заберу сам'} - Оформить заказ
            </button>

            <div className='cart-btn-group'>
              <button onClick={clearCart} className="clean">
                <Trash size={20} className='trash-icon' /> Очистить корзину
              </button>

              <button className='back' onClick={goToCatalog}>
                <BookOpen size={20} className='menu-icon' /> Обратно в меню
              </button>
            </div>

            {/* МОДАЛКА */}
            {isModalOpen && modalStep > 0 && (
              <div className="modal-overlay">
                <div className="modal-content">

                  {modalStep === 1 && (
                    <div className="modal-body">
                      <ConfirmModal
                        title={`Подтвердить оформление заказа ?`}
                        onConfirm={prepareOrder}
                        onCancel={() => { setIsModalOpen(false); setModalStep(0); }}
                        userData={userData}
                        isAdmin={isAdmin}
                        isTerminal={isTerminal}
                        location={location}
                      />
                    </div>
                  )}

                  {modalStep === 2 && currentOrder && (
                    <div className="modal-body">
                      <PaymentHandler
                        order={currentOrder}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        clearCart={clearCart}
                        isDelivery={isDelivery}
                        cartPrice={total}
                        totalPrice={finalAmount}
                        deliveryPrice={deliveryCost}
                        isTerminal={isTerminal}
                        userData={userData}
                        isAdmin={isAdmin}
                        location={location}
                      />
                    </div>
                  )}

                  <div className="modal-footer">
                    <button onClick={() => { setIsModalOpen(false); setModalStep(0); }} className="modal-btn-cancel">Отмена</button>
                  </div>

                </div>
              </div>
            )}

          </>
        )}
      </div>

      {isClosedModal && <ClosedScreen onClose={() => setIsClosedModal(false)} />}
    </div>
  );
}

export default Cart;
