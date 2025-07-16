import './LocationSelect.css'; 

export default function LocationSelect({ onSelect }) {
  return (
    <div className="location-overlay">
      <div className="location-modal">
        <h2>Выберите торговую точку</h2>
        <button className='cuba' onClick={() => onSelect("Kubenskoye-Lenina-Street")}>с.Кубенское, Ленина</button>
        <button className='karlmarks' onClick={() => onSelect("Vologda-Karla-Marksa-Street")}>г.Вологда, Карла Маркса, 17</button>
      </div>
    </div>
  );
}
