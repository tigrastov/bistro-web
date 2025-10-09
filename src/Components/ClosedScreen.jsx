import './ClosedScreen.css';

export default function ClosedScreen({ onClose }) {
  return (
    <div className="closed-overlay">
      <div className="closed-modal">
        <h2>⏰ Магазин закрыт</h2>
        <p>Мы работаем с 10:00 до 21:30</p>
        <p>Пожалуйста, оформите заказ позже</p>
        <button onClick={onClose}>Понятно</button>
      </div>
    </div>
  );
}
