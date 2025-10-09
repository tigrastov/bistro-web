import { locationNames } from './locationNames';
import './LocationSelect.css'; 

export default function LocationSelect({ onSelect }) {
  return (
    <div className="location-overlay">

     <div className="info-time">
        <h2>⏰ Мы принимаем заказы с 10:00 до 21:30</h2>
     </div>

      <div className="location-modal">
        <h2>Выберите торговую точку</h2>
        {Object.entries(locationNames).map(([key, name]) => (
          <button className='btn-location' key={key} onClick={() => onSelect(key)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}