
import './LocationSelect.css'; 
export default function LocationSelect({ onSelect }) {
  return (
    <div className="location-select">
      <h2>Выберите торговую точку</h2>
      <button onClick={() => onSelect("cuba")}>Куба</button>
      <button onClick={() => onSelect("karlmarks")}>Карла Маркса</button>
    </div>
  );
}