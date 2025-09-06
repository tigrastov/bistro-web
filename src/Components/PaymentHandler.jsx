import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationNames } from './locationNames';
import './PaymentHandler.css';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // создаём платёж через Cloud Function
      const response = await fetch(
        'https://us-central1-bistro-app-acfb4.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: Date.now().toString(), // временный ID, Firestore даст свой
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
      <div className="order-summary">
        <p>Адрес пункта заказа: <strong>{locationNames[order.location]}</strong></p>
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