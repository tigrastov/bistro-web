import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header({ userData, location, isAdmin, onChangeLocation }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="header">
      <button className="logotype" onClick={toggleMenu}>
        <img src="/logo100.png" alt="" />
      </button>

      {/* Блок с текущей локацией — только для НЕ админов */}
{!isAdmin && location && (
  <div className="current-location">
    <button className="change-location-btn" onClick={onChangeLocation}>
      <img
        src="/loca.png"
        alt="Геолокация"
        style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}
      />
      {location === 'cuba' ? 'Куба' : 'Карла Маркса'}
    </button>
  </div>
)}

      <button className={`burger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isOpen && <div className="nav-overlay" onClick={() => setIsOpen(false)}></div>}

      <nav className={`nav ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" end onClick={() => setIsOpen(false)}>Меню</NavLink>
        <NavLink to="/cart" onClick={() => setIsOpen(false)}>Корзина</NavLink>
        <NavLink to="/orders" onClick={() => setIsOpen(false)}>Мои заказы</NavLink>
        <NavLink to="/info" onClick={() => setIsOpen(false)}>О нас</NavLink>
        {userData && (userData.role === 'adminCuba' || userData.role === 'adminKarlMarks') && (
          <NavLink to="/admin" onClick={() => setIsOpen(false)}>Админ-панель</NavLink>
        )}
        <NavLink to="/profile" onClick={() => setIsOpen(false)}>Профиль</NavLink>
        <NavLink to="/auth" onClick={() => setIsOpen(false)}>Вход/Регистрация</NavLink>
      </nav>
    </header>
  );
}