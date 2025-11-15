import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationNames } from './locationNames';
import DeliveryForm from "./DeliveryForm";
import './PaymentHandler.css';
import { getFirestore, addDoc, collection, serverTimestamp, doc, updateDoc, getDoc, increment, setDoc } from 'firebase/firestore';
import { useWorkingHours } from '../hooks/useWorkingHours';
import ClosedScreen from '../Components/ClosedScreen';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError, isTerminal, clearCart, isDelivery, cartPrice, totalPrice, deliveryPrice }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState({});
  const [showError, setShowError] = useState(false);

  const { isOpen, serverTime } = useWorkingHours({
    open: "10:00",
    close: "21:30",
    timezone: 3
  });

  if (!isOpen) {
    navigate('/closed');
    return null; 
  }



  // Функция для получения следующего номера заказа
  const getNextOrderNumber = async (location) => {
    const db = getFirestore();
    const counterRef = doc(db, 'counters', `orders_${location}`);

    try {
      const counterSnap = await getDoc(counterRef);
      if (counterSnap.exists()) {
        // Увеличиваем счетчик
        const currentCount = counterSnap.data().count;
        const newCount = currentCount + 1;
        await updateDoc(counterRef, { count: newCount });
        return newCount;
      } else {
        // Создаем новый счетчик
        await setDoc(counterRef, { count: 1 });
        return 1;
      }
    } catch (error) {
      console.error('Ошибка при получении номера заказа:', error);
      // Fallback - используем простой номер
      return Math.floor(Math.random() * 1000) + 1;
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

  if(!isOpen) {
    navigate('/closed');
    return;
  }

    try {
      // 1) Получаем следующий номер заказа
      const orderNumber = await getNextOrderNumber(order.location);

      // 2) Создаём предзаказ (pending) в Firestore, получаем его ID
      const db = getFirestore();

      const total = isDelivery ? totalPrice : cartPrice;

      // Проверка обязательных полей доставки
      if (isDelivery) {
        if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.house) {
          setShowError(true);
          setIsLoading(false);
          return;
        }
      }


      const preOrderRef = await addDoc(
        collection(db, 'locations', order.location, 'orders'),
        {
          userId: order.userId,
          userName: order.clientName,
          userPhone: order.userPhone,
          items: order.items,
          total,
          status: 'ожидает оплаты',
          orderNumber: orderNumber,
          isDelivery: isDelivery,
          deliveryAddress: isDelivery ? deliveryAddress : null,
          createdAt: serverTimestamp(),
        }
      );

      const preOrderId = preOrderRef.id;

      // 2) создаём платёж через Cloud Function и передаём preOrderId
      const response = await fetch(
        'https://us-central1-bistro-app-acfb4.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: preOrderId,
            location: order.location,
            amount: total,
            description: `Заказ на ${total} ₽`,
            clientEmail: order.clientEmail,
            clientName: order.clientName,
            items: order.items.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.paymentUrl) {

        localStorage.setItem('lastOrderId', preOrderId);
        localStorage.setItem('lastOrderNumber', orderNumber);
        localStorage.setItem('lastOrderLocation', order.location);


        window.location.href = data.paymentUrl;

      } else {
        throw new Error(data.message || 'Ошибка создания платежа');
      }
    } catch (err) {
      setError(err.message);
      onPaymentError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };



  //   const handlePaymentDelivery = async () => {
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     // 1) Получаем следующий номер заказа
  //     const orderNumber = await getNextOrderNumber(order.location);

  //     // 2) Рассчитываем цену с доставкой
  //     let totalAmount = order.totalAmount;
  //     if (totalAmount < 2000) {
  //       totalAmount += 3; // доставка платная
  //     }
  //     // иначе доставка бесплатная, totalAmount не меняем

  //     // 3) Создаём заказ с доставкой
  //     const db = getFirestore();
  //     const preOrderRef = await addDoc(
  //       collection(db, 'locations', order.location, 'orders'),
  //       {
  //         userId: order.userId,
  //         userName: order.clientName,
  //         userPhone: order.userPhone,
  //         items: order.items,
  //         total: totalAmount,
  //         status: 'ожидает оплаты',
  //         orderNumber: orderNumber,
  //         delivery: true, // пометка заказа с доставкой
  //         createdAt: serverTimestamp(),
  //       }
  //     );

  //     const preOrderId = preOrderRef.id;

  //     // 4) Создаём платёж через Cloud Function
  //     const response = await fetch(
  //       'https://us-central1-bistro-app-acfb4.cloudfunctions.net/createPayment',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           orderId: preOrderId,
  //           location: order.location,
  //           amount: totalAmount,
  //           description: `Заказ на ${totalAmount} ₽ (с доставкой)`,
  //           clientEmail: order.clientEmail,
  //           clientName: order.clientName,
  //           items: order.items.map(item => ({
  //             name: item.name,
  //             price: item.price,
  //             quantity: item.quantity
  //           }))
  //         }),
  //       }
  //     );

  //     const data = await response.json();

  //     if (data.success && data.paymentUrl) {
  //       localStorage.setItem('lastOrderId', preOrderId);
  //       localStorage.setItem('lastOrderNumber', orderNumber);
  //       localStorage.setItem('lastOrderLocation', order.location);

  //       window.location.href = data.paymentUrl;
  //     } else {
  //       throw new Error(data.message || 'Ошибка создания платежа');
  //     }
  //   } catch (err) {
  //     setError(err.message);
  //     onPaymentError?.(err.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };





  const handleCashPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orderNumber = await getNextOrderNumber(order.location);

      const db = getFirestore();
      await addDoc(collection(db, 'locations', order.location, 'orders'), {
        userId: order.userId,
        userName: order.clientName,
        userPhone: order.userPhone,
        items: order.items,
        total: order.totalAmount,
        status: 'Оплата наличными',
        paymentMethod: 'cash',
        orderNumber: orderNumber,
        createdAt: serverTimestamp(),
      });

      clearCart?.();
      navigate('/success-cash', { state: { orderNumber } });

    } catch (err) {
      console.error('Ошибка при оплате наличными:', err);
      setError(err.message);
      onPaymentError?.(err.message);
      navigate('/fail-cash');
    } finally {
      setIsLoading(false);
    }
  };







  return (
    <div className="payment-handler">
      <h3>Оплата заказа</h3>

      {!isTerminal && (
        <div className="order-loca">
          <p>Адрес пункта заказа: <strong>{locationNames[order.location]}</strong></p>
        </div>

      )}



      <div className="order-summary">




        <p>Сумма к оплате: <strong>{isDelivery ? totalPrice : cartPrice}
          ₽</strong></p>
        <p>Статус: <span className={`status ${order.status}`}>{order.status}</span></p>
        <div className="order-items">
          <h4>Товары в заказе:</h4>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <span>{item.name}</span>
              <span>{item.quantity} x {item.price} ₽</span>
            </div>
          ))}
          <span> {isDelivery ? `Доставка - ${deliveryPrice}₽` : "Самовывоз"}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}


      {!isTerminal && (
        <div className="user-pay">

          {isDelivery && (

            <DeliveryForm onChange={setDeliveryAddress} location={order.location} />

          )}




          {showError && (
            <div className="error-popup">
              <div className="error-popup-content">
                <p>Необходимо заполнить форму доставки </p>
                <button onClick={() => setShowError(false)}>OK</button>
              </div>
            </div>
          )}



          {isDelivery && (
            <button
              className="pay-button-delivery"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Создание платежа...
                </>
              ) : (
                `Оплатить ${totalPrice}₽ заказ с доставкой`
              )}
            </button>
          )}




          {!isDelivery && (
            <button
              className="pay-button-self-pickup"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Создание платежа...
                </>
              ) : (
                `Оплатить ${cartPrice}₽ заказ самовывозом`
              )}
            </button>
          )}

        </div>
      )}

      {isTerminal && (

        <div className='terminal-pay'>

          <button
            className="pay-button-online-terminal"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? 'Создание платежа...' : 'Оплатить заказ онлайн (СБП)'}
          </button>

          <button
            className="cash-pay-button"
            onClick={handleCashPayment}
            disabled={isLoading}
          >
            {isLoading ? 'Создание платежа...' : 'Оплата наличными на кассе'}
          </button>



        </div>

      )}

      <button
        className="cancel-button"
        onClick={() => navigate('/')}
      >
        Отменить оплату
      </button>

    </div>
  );
};

export default PaymentHandler;