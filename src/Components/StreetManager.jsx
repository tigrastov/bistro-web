// StreetManager.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ArrowLeft, Search, X } from 'lucide-react';
import './StreetManager.css';

function StreetManager({ location }) {
  const [streets, setStreets] = useState([]);
  const [newStreet, setNewStreet] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const db = getFirestore();

  // Загрузка улиц
  useEffect(() => {
    if (!location) {
      navigate('/admin');
      return;
    }

    const loadStreets = async () => {
      try {
        const locRef = doc(db, 'locations', location);
        const snap = await getDoc(locRef);
        const data = snap.data() || {};
        setStreets(data.streets || []);
      } catch (error) {
        console.error('Ошибка загрузки улиц:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreets();
  }, [location, db, navigate]);

  // Проверка на дубликаты
  const isDuplicate = (streetName) => {
    return streets.some(street => 
      street.toLowerCase().trim() === streetName.toLowerCase().trim()
    );
  };

  // Добавить улицу (с проверкой дублей)
  const handleAddStreet = async () => {
    const streetToAdd = newStreet.trim();
    
    if (!streetToAdd) return;
    
    // Проверка на дубликат
    if (isDuplicate(streetToAdd)) {
      alert(`Улица "${streetToAdd}" уже есть в списке!`);
      setNewStreet('');
      return;
    }

    try {
      const locRef = doc(db, 'locations', location);
      await updateDoc(locRef, {
        streets: arrayUnion(streetToAdd)
      });
      setStreets(prev => [...prev, streetToAdd].sort());
      setNewStreet('');
    } catch (error) {
      console.error('Ошибка добавления улицы:', error);
      alert('Не удалось добавить улицу');
    }
  };

  // Удалить улицу
  const handleRemoveStreet = async (streetToRemove) => {
    if (!window.confirm(`Удалить улицу "${streetToRemove}"?`)) return;

    try {
      const locRef = doc(db, 'locations', location);
      await updateDoc(locRef, {
        streets: arrayRemove(streetToRemove)
      });
      setStreets(prev => prev.filter(s => s !== streetToRemove));
    } catch (error) {
      console.error('Ошибка удаления улицы:', error);
      alert('Не удалось удалить улицу');
    }
  };

  // Фильтрация улиц по поиску
  const filteredStreets = streets.filter(street =>
    street.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort();

  // Очистить поиск
  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return <div className="street-manager-loading">Загрузка...</div>;
  }

  return (
    <div className="street-manager">
      {/* КНОПКА НАЗАД - в левом верхнем углу */}
      <div className="street-manager-header">
        <div className="header-top-row">
          <button 
            onClick={() => navigate('/admin')}
            className="back-btn"
          >
            <ArrowLeft size={20} /> Назад в админку
          </button>
          <div className="location-display">
            Локация: <strong>{location}</strong>
          </div>
        </div>
        
        <h1>Управление улицами</h1>
      </div>

      <div className="street-manager-content">
        {/* ФОРМА ДОБАВЛЕНИЯ */}
        <div className="add-street-section">
          <div className="add-street-input-wrapper">
            <input
              type="text"
              value={newStreet}
              onChange={(e) => setNewStreet(e.target.value)}
              placeholder="Введите название улицы"
              onKeyPress={(e) => e.key === 'Enter' && handleAddStreet()}
              className="street-input"
            />
            {newStreet && isDuplicate(newStreet.trim()) && (
              <div className="duplicate-warning">
                ⚠️ Эта улица уже есть в списке
              </div>
            )}
          </div>
          <button 
            onClick={handleAddStreet}
            disabled={!newStreet.trim() || isDuplicate(newStreet.trim())}
            className="add-btn"
          >
            Добавить улицу
          </button>
        </div>

        {/* ПОИСК */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск улицы..."
              className="search-input"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="clear-search-btn">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="search-stats">
            Найдено: {filteredStreets.length} из {streets.length}
          </div>
        </div>

        {/* СПИСОК УЛИЦ */}
        <div className="streets-list-section">
          <div className="list-header">
            <h3>Список улиц</h3>
            {searchQuery && filteredStreets.length === 0 ? (
              <div className="no-results">
                По запросу "{searchQuery}" ничего не найдено
              </div>
            ) : null}
          </div>
          
          {streets.length === 0 ? (
            <div className="empty-state">
              <p className="empty-list">Список улиц пуст</p>
              <p className="empty-hint">Добавьте первую улицу выше</p>
            </div>
          ) : (
            <div className="streets-grid-container">
              <div className="streets-grid">
                {filteredStreets.map((street, index) => (
                  <div key={index} className="street-card">
                    <span className="street-name">{street}</span>
                    <button
                      onClick={() => handleRemoveStreet(street)}
                      className="remove-btn"
                      title="Удалить улицу"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StreetManager;