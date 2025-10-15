import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentResult.css'; // можно один общий стиль для обеих страниц

export default function SuccessCash() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderNumber = location.state?.orderNumber || 'N/A'; // Получаем номер заказа из состояния навигации

  return (
    <div className="payment-result success">
      <h2>✅ Заказ создан и отправлен на обработку </h2>
      <p>Пройдите на кассу для оплаты</p>
      {orderNumber && (
        <h1>
          Номер вашего заказа: <strong className='number'>{orderNumber}</strong>
        </h1>
      )}

      <button className="btn-success" onClick={() => navigate('/')}>
        Вернуться на главную
      </button>
    </div>
  );
}
