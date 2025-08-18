import React, { useState } from 'react';
import './PaymentHandler.css';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Создаем счет через API Альфа-Банка
      const response = await fetch('https://us-central1-bistro-app-acfb4.cloudfunctions.net/createPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          // Передадим местоположение заказа для обновления в БД
          location: localStorage.getItem('location'),
          amount: order.totalAmount,
          description: `Заказ #${order.id}`,
          clientEmail: order.clientEmail,
          clientName: order.clientName,
          items: order.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // 2. Перенаправляем на страницу оплаты Альфа-Банка
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
      <h3>Оплата заказа #{order.id}</h3>
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
        disabled={isLoading || order.status === 'paid'}
      >
        {isLoading ? 'Создание платежа...' : 'Оплатить заказ'}
      </button>
    </div>
  );
};

export default PaymentHandler;