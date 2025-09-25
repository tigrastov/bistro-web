

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

import Header from './Components/Header';
import Catalog from './Pages/Catalog';
import Orders from './Pages/Orders';
import Info from './Pages/Info';
import Cart from './Pages/Cart';
import Profile from './Pages/Profile';
import DetailView from './Pages/DetailView.jsx';
import Auth from './Pages/Auth.jsx';
import AdminPanel from './Pages/AdminPanel.jsx';
import AddProduct from './Pages/AddProduct.jsx';
import Success from './Pages/Success.jsx';
import Fail from './Pages/Fail.jsx';
import LocationSelect from './Components/LocationSelect.jsx';
import './App.css';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation(); // безопасно, потому что внутри Router

  const [userData, setUserData] = useState(null);
  const [locationState, setLocationState] = useState(() => localStorage.getItem("location") || "");
  const [cartCount, setCartCount] = useState(0);

  const [hasOrders, setHasOrders] = useState(!!localStorage.getItem('hasOrders'));

  const isAdminCuba = userData?.role === 'adminCuba';
  const isTerminalCuba = userData?.role === 'terminalCuba';
  const isTerminalKarlMarks = userData?.role === 'terminalKarlMarks';
  const isAdminKarlMarks = userData?.role === 'adminKarlMarks';
  const isAdmin = isAdminCuba || isAdminKarlMarks;
  const isTerminal = isTerminalCuba || isTerminalKarlMarks;

  const effectiveLocation = isAdminCuba || isTerminalCuba
    ? 'Kubenskoye-Lenina-Street'
    : isAdminKarlMarks || isTerminalKarlMarks
      ? 'Vologda-Karla-Marksa-Street'
      : locationState;

  const handleLocationSelect = (loc) => {
    setLocationState(loc);
    localStorage.setItem("location", loc);
  };

  const checkHasOrders = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setHasOrders(false);
      return;
    }

    const locationIds = ['Kubenskoye-Lenina-Street', 'Vologda-Karla-Marksa-Street'];
    const doneStatuses = new Set(['завершён', 'завершен', 'отменён', 'отменен', 'completed', 'cancelled', 'canceled']);

    let flag = false;

    for (const locationId of locationIds) {
      const ordersRef = collection(db, 'locations', locationId, 'orders');
      const q = query(ordersRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) continue;

      for (const doc of snapshot.docs) {
        const statusRaw = (doc.data()?.status || '').toString().trim().toLowerCase();
        if (!doneStatuses.has(statusRaw)) {
          flag = true;
          break;
        }
      }

      if (flag) break;
    }

    setHasOrders(flag);
  };

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = Array.isArray(cart)
          ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        setCartCount(count);
      } catch (e) {
        console.error('Ошибка чтения cart из localStorage', e);
        setCartCount(0);
      }
    };

    updateCartCount();

    const onStorage = (e) => {
      if (!e.key || e.key === 'cart' || e.key === 'currentOrder') updateCartCount();
    };

    const onCartChanged = () => updateCartCount();

    window.addEventListener('storage', onStorage);
    window.addEventListener('cart-changed', onCartChanged);
    window.addEventListener('focus', updateCartCount);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart-changed', onCartChanged);
      window.removeEventListener('focus', updateCartCount);
    };
  }, [location.pathname, effectiveLocation]);

  // Первичная проверка на монтировании
  useEffect(() => {
    checkHasOrders();
  }, []);

  // Синхронизация localStorage
  useEffect(() => {
    if (hasOrders) {
      localStorage.setItem('hasOrders', '1');
    } else {
      localStorage.removeItem('hasOrders');
    }
  }, [hasOrders]);

  // Проверка при создании нового заказа
  useEffect(() => {
    const listener = () => {
      if (localStorage.getItem('hasOrders')) {
        setHasOrders(true); // оптимистично показываем иконку
      }
      checkHasOrders();
    };
    window.addEventListener('orders-changed', listener);
    return () => window.removeEventListener('orders-changed', listener);
  }, []);

  // Важное: ждём готовность auth и реактивно проверяем заказы
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, () => {
      checkHasOrders();
    });
    return () => unsub();
  }, []);

  return (
    <div className='app-container'>
      <Header
        userData={userData}
        location={effectiveLocation}
        isAdmin={isAdmin}
        isTerminal={isTerminal}
        cartCount={cartCount}
        onChangeLocation={() => {
          setLocationState("");
          localStorage.removeItem("location");
          localStorage.removeItem("cart");
          localStorage.removeItem("currentOrder");
          setCartCount(0);
        }}
      />

      {!effectiveLocation && !isAdmin ? (
        <LocationSelect onSelect={handleLocationSelect} />
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: [1, 0, 1, 1] }}
                >
                  <Catalog location={effectiveLocation} cartCount={cartCount} hasOrders={hasOrders} />
                </motion.div>
              }
            />
            <Route
              path="/product/:id"
              element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, ease: [1, 0, 1, 1] }}
                >
                  <DetailView
                    location={effectiveLocation}
                    userData={userData}
                    setCartCount={setCartCount}
                  />
                </motion.div>
              }
            />
            <Route
              path="/cart"
              element={
                <motion.div
                  initial={{ opacity: 0, y: -40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -40, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
                >
                  <Cart location={effectiveLocation} setCartCount={setCartCount} />
                </motion.div>
              }
            />
            <Route
              path="/orders"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  transition={{ duration: 0.7, ease: [0.42, 0, 0.58, 1] }}
                >
                  <Orders location={effectiveLocation} />
                </motion.div>
              }
            />
            <Route
              path="/info"
              element={
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
                >
                  <Info />
                </motion.div>
              }
            />
            <Route
              path="/profile"
              element={
                <motion.div
                  initial={{ opacity: 0, y: -30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.97 }}
                  transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
                >
                  <Profile />
                </motion.div>
              }
            />
            <Route path="/auth" element={<Auth setUserData={setUserData} />} />
            <Route path="/admin" element={<AdminPanel location={effectiveLocation} userData={userData} />} />
            <Route path="/success" element={<Success />} />
            <Route path="/fail" element={<Fail />} />
            <Route path="/admin/add-product" element={<AddProduct location={effectiveLocation} />} />
          </Routes>
        </AnimatePresence>
      )}
    </div>
  );
}

export default AppWrapper;