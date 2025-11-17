import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';
import { locationNames } from './locationNames';


export default function Header({ userData, location, isAdmin, isTerminal, adminRoles, onChangeLocation, cartCount }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="header">

      <button className="penguin" onClick={toggleMenu}>
        <img src="/penguin.png" alt="IMG" />
      </button>


      <div className="header-left">

        <div className="logotype">
          <img src="/logoFull.png" alt="Логотип" />
        </div>


        {!isAdmin && !isTerminal && location && (
          <div className="current-location">
            <button className="change-location-btn" onClick={onChangeLocation}>
              <img
                src="/loca.png"
                alt="Геолокация"
                style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}
              />
              {/* {location === 'Kubenskoye-Lenina-Street' ? 'c.Кубенское, Ленина, 10' : 'г.Вологда, Карла Маркса, 17'} */}
              {locationNames[location]}
            </button>
          </div>
        )}
      </div>



      <div className="burger-wrap">
        <button className={`burger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        {cartCount > 0 && <span className="cart-badge burger-badge">{cartCount}</span>}
      </div>

      {isOpen && <div className="nav-overlay open" onClick={() => setIsOpen(false)}></div>}


      <nav className={`nav ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" end onClick={() => setIsOpen(false)}>Меню</NavLink>





        {!isAdmin && (
          <NavLink to="/cart" onClick={() => setIsOpen(false)} className="cart-link">
            Корзина
            {cartCount > 0 && <span className="cart-badge inline">{cartCount}</span>}
          </NavLink>
        )}


        {!isAdmin && (
          <NavLink to="/orders" onClick={() => setIsOpen(false)}>Мои заказы</NavLink>
        )}


        {!isAdmin && !isTerminal && (
          <NavLink to="/info" onClick={() => setIsOpen(false)}>О нас</NavLink>
        )}



        {/* {userData && (userData.role === 'adminCuba' || userData.role === 'adminKarlMarks') && (
          <NavLink to="/admin" onClick={() => setIsOpen(false)}>Админ-панель</NavLink>
        )} */}
        {userData && adminRoles.includes(userData.role) && (
          <NavLink to="/admin" onClick={() => setIsOpen(false)}>
            Админ-панель
          </NavLink>
        )}


        {!isTerminal && userData && (
          <NavLink to="/profile" onClick={() => setIsOpen(false)}>Профиль</NavLink>
        )}

        {!userData && !isTerminal && (

          <NavLink to="/auth" onClick={() => setIsOpen(false)}>Вход/Регистрация</NavLink>
        )}



      </nav>
    </header>
  );
}
