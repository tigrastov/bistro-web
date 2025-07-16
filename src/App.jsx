import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Catalog from './Pages/Catalog';
import Orders from './Pages/Orders';
import Info from './Pages/Info';
import Cart from './Pages/Cart';
import Profile from './Pages/Profile';
import DetailView from './Pages/DetailView.jsx';
import Auth from './Pages/Auth.jsx';
import AdminPanel from './Pages/AdminPanel.jsx'; 
import './App.css';
import { useState, useEffect } from 'react';
import LocationSelect from './Components/LocationSelect.jsx'; 
import AddProduct from './Pages/AddProduct.jsx';


function App() {
  const [userData, setUserData] = useState(null);
  const [location, setLocation] = useState(() => localStorage.getItem("location") || "");
  const [cartCount, setCartCount] = useState(0);
  // Определяем, админ ли пользователь
  const isAdminCuba = userData?.role === 'adminCuba';
  const isAdminKarlMarks = userData?.role === 'adminKarlMarks';
  const isAdmin = isAdminCuba || isAdminKarlMarks;

  // Жёстко привязываем location для админов
  const effectiveLocation = isAdminCuba
    ? 'Kubenskoye-Lenina-Street'
    : isAdminKarlMarks
      ? 'Vologda-Karla-Marksa-Street'
      : location;

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    localStorage.setItem("location", loc);
  };


  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const count = cart.reduce((sum, item) => sum + item.quantity, 0); // количество товаров
      setCartCount(count);
    };

    updateCartCount();

    // Подписка на событие — любое обновление localStorage
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);
  return (
    <Router>
      <div className='app-container'>
        <Header
          userData={userData}
          location={effectiveLocation}
          isAdmin={isAdmin}
          cartCount={cartCount}
          onChangeLocation={() => {
            setLocation("");
            localStorage.removeItem("location");
          }}
        />
        {/* Для админов не показываем выбор локации */}
        {!effectiveLocation && !isAdmin ? (
          <LocationSelect onSelect={handleLocationSelect} />
        ) : (
          <Routes>
            <Route path="/" element={<Catalog location={effectiveLocation} />} />
            <Route path="/cart"element={<Cart location={effectiveLocation} setCartCount={setCartCount} />}/>
            <Route path="/orders" element={<Orders location={effectiveLocation} />} />
            <Route path="/info" element={<Info />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth setUserData={setUserData} />} />
            <Route path="/admin" element={<AdminPanel location={effectiveLocation}userData={userData} />
  }
/>

            {/* <Route path="/admin" element={<AdminPanel />} /> */}

            {/* <Route path="/product/:id" element={<DetailView />} /> */}
            {/* <Route path="/admin/add-product" element={<AddProduct />} /> */}
            <Route path="/admin/add-product" element={<AddProduct location={effectiveLocation} />} />
            <Route
           path="/product/:id"
           element={
         <DetailView
      location={effectiveLocation}
      userData={userData}
      setCartCount={setCartCount}
    />
  }
/>
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;