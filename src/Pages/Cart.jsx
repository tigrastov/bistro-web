// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import {
//   getFirestore,
//   doc,
//   getDoc,
//   collection,
//   addDoc,
//   serverTimestamp,
// } from 'firebase/firestore';
// import './Cart.css';
// import ConfirmModal from './ConfirmModal';
// import PaymentHandler from '../Components/PaymentHandler';

// function Cart({ setCartCount }) {
//   const [cartItems, setCartItems] = useState([]);
//   const [user, setUser] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [swipedIndex, setSwipedIndex] = useState(null);
//   const [showPayment, setShowPayment] = useState(false);
//   const [currentOrder, setCurrentOrder] = useState(null);
//   const navigate = useNavigate();

//   let touchStartX = 0;

//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);

//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleSwipeStart = (e) => {
//     touchStartX = e.changedTouches[0].clientX;
//   };

//   const handleSwipeEnd = (e, index) => {
//     const touchEndX = e.changedTouches[0].clientX;
//     const diff = touchStartX - touchEndX;

//     if (diff > 50) {
//       setSwipedIndex(index);
//     } else {
//       setSwipedIndex(null);
//     }
//   };

//   const removeItem = (id) => {
//     const updatedCart = cartItems.filter((item) => item.id !== id);
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     const newCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
//     setCartCount(newCount);
//   };

//   const clearCart = () => {
//     localStorage.removeItem('cart');
//     setCartItems([]);
//     setCartCount(0);
//   };

//   const sendOrder = async () => {
//     if (!user) {
//       alert('Вы должны авторизоваться, чтобы оформить заказ');
//       navigate('/auth');
//       return;
//     }

//     const location = localStorage.getItem('location');
//     if (!location) {
//       alert('Локация не выбрана');
//       return;
//     }

//     const db = getFirestore();

//     try {
//       const userRef = doc(db, 'users', user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         alert('Не удалось получить данные пользователя');
//         return;
//       }

//       const userData = userSnap.data();
//       const total = cartItems.reduce(
//         (acc, item) => acc + item.price * item.quantity,
//         0
//       );

//       // Создаем заказ
//       const orderRef = await addDoc(collection(db, 'locations', location, 'orders'), {
//         userId: user.uid,
//         userName: userData.name,
//         userPhone: userData.phone,
//         items: cartItems,
//         total,
//         createdAt: serverTimestamp(),
//         status: 'новый',
//       });

//       // Сохраняем информацию о заказе
//       setCurrentOrder({
//         id: orderRef.id,
//         totalAmount: total,
//         status: 'новый',
//         clientEmail: userData.email || '',
//         clientName: userData.name,
//         items: cartItems
//       });

//       // Закрываем модальное окно и показываем оплату
//       setIsModalOpen(false);
//       setShowPayment(true);

//     } catch (error) {
//       console.error('Ошибка при оформлении заказа:', error);
//       alert('Произошла ошибка при оформлении заказа');
//     }
//   };

//   // Обработчик успешной оплаты
//   const handlePaymentSuccess = () => {
//     clearCart();
//     setShowPayment(false);
//     setCurrentOrder(null);
//     alert('Заказ успешно оплачен!');
//   };

//   // Обработчик ошибки оплаты
//   const handlePaymentError = (error) => {
//     console.error('Ошибка платежа:', error);
//     alert('Произошла ошибка при оплате. Попробуйте еще раз.');
//   };

//   // Если показываем оплату
//   if (showPayment && currentOrder) {
//     return (
//       <div className="cart-page">
//         <div className="cart">
//           <h1>Оплата заказа #{currentOrder.id}</h1>
//           <PaymentHandler 
//             order={currentOrder}
//             onPaymentSuccess={handlePaymentSuccess}
//             onPaymentError={handlePaymentError}
//           />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="cart-page">
//       <div className="cart">
//         <h1>Корзина</h1>
//         {cartItems.length === 0 ? (
//           <p>Корзина пуста</p>
//         ) : (
//           <>
//             <ul className="cart-list">
//               {cartItems.map((item, index) => (
//                 <li
//                   key={item.id}
//                   className={`cart-item ${swipedIndex === index ? 'swipe-left' : ''}`}
//                   onTouchStart={(e) => handleSwipeStart(e)}
//                   onTouchEnd={(e) => handleSwipeEnd(e, index)}
//                 >
//                   <div className="info">
//                     <div className="left-space" />
//                     <span>{item.quantity}</span>
//                     <span>{item.name}</span>
//                     <span className="nowrap">{item.price * item.quantity} ₽</span>
//                   </div>
//                   <div className="actions">
//                     <button
//                       className="remove-item-btn"
//                       onClick={() => removeItem(item.id)}
//                     >
//                       Удалить
//                     </button>
//                   </div>
//                 </li>
//               ))}
//             </ul>

//             <p className="cart-total">
//               Общая стоимость:{' '}
//               {cartItems.reduce(
//                 (acc, item) => acc + item.price * item.quantity,
//                 0
//               )}{' '}
//               ₽
//             </p>

//             <button onClick={clearCart} className="clear-cart-btn">
//               Очистить корзину
//             </button>

//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="checkout-btn"
//             >
//               Оформить заказ
//             </button>

//             {isModalOpen && (
//               <ConfirmModal
//                 title="Подтвердить оформление заказа?"
//                 onConfirm={() => {
//                   sendOrder();
//                 }}
//                 onCancel={() => setIsModalOpen(false)}
//               />
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Cart;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
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

    try {
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

      const orderRef = await addDoc(collection(db, 'locations', location, 'orders'), {
        userId: user.uid,
        userName: userData.name,
        userPhone: userData.phone,
        items: cartItems,
        total,
        createdAt: serverTimestamp(),
        status: 'новый',
      });

      setCurrentOrder({
        id: orderRef.id,
        totalAmount: total,
        status: 'новый',
        clientEmail: userData.email || '',
        clientName: userData.name,
        items: cartItems
      });

      setIsModalOpen(false);
      setShowPayment(true);

    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      alert('Произошла ошибка при оформлении заказа');
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setShowPayment(false);
    setCurrentOrder(null);
    alert('Заказ успешно оплачен!');
  };

  const handlePaymentError = (error) => {
    console.error('Ошибка платежа:', error);
    alert('Произошла ошибка при оплате. Попробуйте еще раз.');
  };

  if (showPayment && currentOrder) {
    return (
      <div className="cart-page">
        <div className="cart">
          <h1>Оплата заказа #{currentOrder.id}</h1>
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
                  <div className="info">
                    <div className="left-space" />
                    <span>{item.quantity}</span>
                    <span>{item.name}</span>
                    <span className="nowrap">{item.price * item.quantity} ₽</span>
                    <button
                      className="remove-item-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      Удалить
                    </button>
                  </div>
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
                title="Подтвердить оформление заказа?"
                onConfirm={() => {
                  sendOrder();
                }}
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