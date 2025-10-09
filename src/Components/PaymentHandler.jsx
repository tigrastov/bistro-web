import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationNames } from './locationNames';
import './PaymentHandler.css';
import { getFirestore, addDoc, collection, serverTimestamp, doc, updateDoc, getDoc, increment, setDoc } from 'firebase/firestore';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

    try {
      // 1) Получаем следующий номер заказа
      const orderNumber = await getNextOrderNumber(order.location);

      // 2) Создаём предзаказ (pending) в Firestore, получаем его ID
      const db = getFirestore();
      const preOrderRef = await addDoc(
        collection(db, 'locations', order.location, 'orders'),
        {
          userId: order.userId,
          userName: order.clientName,
          userPhone: order.userPhone,
          items: order.items,
          total: order.totalAmount,
          status: 'ожидает оплаты',
          orderNumber: orderNumber,
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
            amount: order.totalAmount,
            description: `Заказ на ${order.totalAmount} ₽`,
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

  return (
    <div className="payment-handler">
      <h3>Оплата заказа</h3>

<div className="order-loca">
          <p>Адрес пункта заказа: <strong>{locationNames[order.location]}</strong></p>
        </div>


      <div className="order-summary">

        

       
        <p>Сумма к оплате: <strong>{order.totalAmount} ₽</strong></p>
        <p>Статус: <span className={`status ${order.status}`}>{order.status}</span></p>
        <div className="order-items">
          <h4>Товары в заказе:</h4>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <span>{item.name}</span>
              <span>{item.quantity} x {item.price} ₽</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="pay-button"
        onClick={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? 'Создание платежа...' : 'Оплатить заказ'}
      </button>

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