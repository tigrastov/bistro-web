import { locationNames } from './locationNames';
import './LocationSelect.css'; 

export default function LocationSelect({ onSelect }) {
  return (
    <div className="location-overlay">
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