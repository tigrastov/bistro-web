import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header({ userData, location, isAdmin, onChangeLocation, cartCount }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="header">
      {/* Кнопка логотипа слева (бургер в mobile) */}
      <div className="header-left">
        <button className="logotype" onClick={toggleMenu}>
          <img src="public/LogoIcon.png" alt="Логотип" />
        </button>

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
      </div>

      {/* Центрированный логотип-текст — только на десктопе */}
      <div className="logo-center">
        <img src="public/LogoText.png" alt="LogoText" />
      </div>

      {/* Бургер-меню справа */}
      <div className="burger-wrap">
        <button className={`burger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        {cartCount > 0 && <span className="cart-badge burger-badge">{cartCount}</span>}
      </div>

      {isOpen && <div className="nav-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Навигация */}
      <nav className={`nav ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" end onClick={() => setIsOpen(false)}>Меню</NavLink>
        <NavLink to="/cart" onClick={() => setIsOpen(false)} className="cart-link">
          Корзина
          {cartCount > 0 && <span className="cart-badge inline">{cartCount}</span>}
        </NavLink>
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
