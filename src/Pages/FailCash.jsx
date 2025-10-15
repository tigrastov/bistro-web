import { useNavigate } from 'react-router-dom';
import './PaymentResult.css';

export default function FailCash() {
  const navigate = useNavigate();

  return (
    <div className="payment-result fail">
      <h2>❌ Ошибка при оплате наличными</h2>
      <p>Что-то пошло не так. Попробуйте снова или обратитесь к администратору.</p>

      <button onClick={() => navigate(-1)}>
        Вернуться назад
      </button>
    </div>
  );
}
