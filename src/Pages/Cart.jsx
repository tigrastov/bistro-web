import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkingHours } from '../hooks/useWorkingHours';

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
import ClosedScreen from '../Components/ClosedScreen';
import ConfirmModal from './ConfirmModal';
import PaymentHandler from '../Components/PaymentHandler';

import { BookOpen } from "lucide-react";
import { Trash } from "lucide-react";

function Cart({ setCartCount, isAdmin, isTerminal, userData, location }) {


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


  // const { isOpen, serverTime } = useWorkingHours(10.00, 21.30,); 


  const { isOpen, serverTime } = useWorkingHours({
    open: "10:00",
    close: "21:30",
    timezone: 3
  });


  

  const [isClosedModal, setIsClosedModal] = useState(false);


  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);


  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const deliveryCost = calculateDelivery(total);
  const finalAmount = total + deliveryCost;

  // const canDeliver = total >= 300;
  const canDeliver = deliveryCost !== null;

  const [isDelivery, setIsDelivery] = useState(false);




  const navigate = useNavigate();
  const goToCatalog = () => {
    navigate('/');
  }

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


  useEffect(() => {
    if (serverTime) {
      console.log("Серверное время Firebase:", serverTime.toLocaleString());
      console.log("Локальное время компьютера:", new Date().toLocaleString());
    }
  }, [serverTime]);


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

    // Проверка через серверное время
    if (!isOpen) {
      setIsClosedModal(true);
      return; // не продолжаем оформление заказа
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

            clearCart={clearCart}


            userData={userData}
            isAdmin={isAdmin}
            isTerminal={isTerminal}
            location={location}
            isDelivery={isDelivery}
            cartPrice={total}
            totalPrice={finalAmount}
            deliveryPrice={deliveryCost}


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


              <div className='delivery-price'>
                <p className='price'>Стоимость доставки:</p>
                <p> от 299 до 599 ₽ - 209 ₽</p>
                <p> от 600 до 899 ₽ - 159 ₽</p>
                <p> от 900 до 1099 ₽ - 109 ₽</p>
                <p> от 1100 до 1399 ₽ - 69 ₽</p>
                <p> от 1400 ₽ - Бесплатно ₽</p>
              </div>



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

              <div>


                <p className="cart-total">
                  Общая стоимость без доставки:{' '}
                  {/* {cartItems.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                  )}{' '} */}
                  {total}
                  ₽
                </p>


                {canDeliver ? (<p className="cart-delivery">
                  Стоимость доставки:{" "}
                  {deliveryCost === 0 ? (
                    <strong style={{ color: "green" }}>Бесплатно</strong>
                  ) : (
                    <strong>{deliveryCost} ₽</strong>
                  )}
                </p>) : (<p className="cart-delivery"> 🚫 Доставка доступна только для заказов от 300₽</p>)}




                {canDeliver && (
                  <p className="cart-final">
                    Итого с доставкой: <strong>{finalAmount} ₽</strong>
                  </p>
                )}

              </div>

            </ul>


            {canDeliver && (
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setIsDelivery(true);
                }}


                className="checkout-btn-delivery"
              >
                <strong>{finalAmount} ₽</strong> - Оформить заказ c доставкой
              </button>
            )}





            <button
              onClick={() => {
                setIsDelivery(false);
                setIsModalOpen(true)
              }}
              className="checkout-btn"
            >
              <strong> {cartItems.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              )}{' '} ₽</strong> - Заберу сам Оформить заказ

            </button>






            <div className='cart-btn-group'>
              <button onClick={clearCart} className="clean">
                <Trash size={20} className='trash-icon' /> Очистить корзину
              </button>

              <button className='back' onClick={goToCatalog}>
                <BookOpen size={20} className='menu-icon' /> Обратно в меню
              </button>
            </div>




            {isModalOpen && (
              <ConfirmModal
                title={`Подтвердить оформление заказа ?`}
                onConfirm={sendOrder}
                onCancel={() => setIsModalOpen(false)}


                userData={userData}
                isAdmin={isAdmin}
                isTerminal={isTerminal}
                location={location}

              />
            )}
          </>
        )}
      </div>


      {isClosedModal && <ClosedScreen onClose={() => setIsClosedModal(false)} />}


    </div>
  );
}

export default Cart;