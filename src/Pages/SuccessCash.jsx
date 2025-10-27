import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentResult.css'; 

export default function SuccessCash() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderNumber = location.state?.orderNumber || 'N/A'; 

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
