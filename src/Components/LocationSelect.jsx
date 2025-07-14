import './LocationSelect.css'; 

export default function LocationSelect({ onSelect }) {
  return (
    <div className="location-overlay">
      <div className="location-modal">
        <h2>Выберите торговую точку</h2>
        <button className='cuba' onClick={() => onSelect("cuba")}>с.Кубенское, Ленина, 10</button>
        <button className='karlmarks' onClick={() => onSelect("karlmarks")}>г.Вологда, Карла Маркса, 37</button>
      </div>
    </div>
  );
}
