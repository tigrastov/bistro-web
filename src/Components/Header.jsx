import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="header">
      <div className="logo">
        <p>Logo</p>
      </div>
      <button className={`burger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav className={`nav ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" end onClick={() => setIsOpen(false)}>Меню</NavLink>
        <NavLink to="/cart" onClick={() => setIsOpen(false)}>Корзина</NavLink>
        <NavLink to="/orders" onClick={() => setIsOpen(false)}>Мои заказы</NavLink>
        <NavLink to="/info" onClick={() => setIsOpen(false)}>О нас</NavLink>
        <NavLink to="/profile" onClick={() => setIsOpen(false)}>Профиль</NavLink>
      </nav>
    </header>
  );
}
