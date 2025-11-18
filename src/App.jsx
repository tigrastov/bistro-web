

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';

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
import SuccessCash from './Pages/SuccessCash.jsx';  
import FailCash from './Pages/FailCash.jsx';
import ClosedScreen from './Components/ClosedScreen';
import StopMarket from './Pages/StopMarkert.jsx';
import './App.css';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation(); 

  const [userData, setUserData] = useState(() => {
    try {
      const cached = localStorage.getItem('userData');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [locationState, setLocationState] = useState(() => localStorage.getItem("location") || "");
  const [cartCount, setCartCount] = useState(0);

  const [hasOrders, setHasOrders] = useState(!!localStorage.getItem('hasOrders'));

  const [isStopMarket, setIsStopMarket] = useState(false);

  

  // словарь: роли → рабочие локации
const roleToLocation = {
  adminCuba: 'Kubenskoye-Lenina-Street',
  terminalCuba: 'Kubenskoye-Lenina-Street',
  adminKarlMarks: 'Vologda-Karla-Marksa-Street',
  terminalKarlMarks: 'Vologda-Karla-Marksa-Street',
  adminFrz: 'Vologda-Fryazinovskaya-Street', 
  terminalFrz: 'Vologda-Fryazinovskaya-Street'
};

// массивы ролей для проверки прав
const adminRoles = ['adminCuba', 'adminKarlMarks', 'adminFrz'];
const terminalRoles = ['terminalCuba', 'terminalKarlMarks', 'terminalFrz'];

// проверка роли
const isAdmin = adminRoles.includes(userData?.role);
const isTerminal = terminalRoles.includes(userData?.role);

// определяем рабочую локацию
const effectiveLocation = roleToLocation[userData?.role] || locationState;

// подписка на стоп-маркет для текущей локации
useEffect(() => {
  if (!effectiveLocation) {
    setIsStopMarket(false);
    return;
  }

  const locationRef = doc(db, 'locations', effectiveLocation);
  const unsub = onSnapshot(
    locationRef,
    (snap) => {
      const data = snap.data() || {};
      setIsStopMarket(!!data.stopMarket);
    },
    () => {
      // при ошибке подписки не блокируем работу приложения
      setIsStopMarket(false);
    }
  );

  return () => unsub();
}, [effectiveLocation]);

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

    const locationIds = ['Kubenskoye-Lenina-Street', 'Vologda-Karla-Marksa-Street', 'Vologda-Fryazinovskaya-Street'];
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

  // Загрузка профиля пользователя и кэширование
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        localStorage.removeItem('userData');
        setHasOrders(false);
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const profile = snap.exists() ? (snap.data() || null) : null;
        setUserData(profile);
        try { localStorage.setItem('userData', JSON.stringify(profile)); } catch {}
      } catch {
        // игнорируем сбои чтения профиля, оставляем предыдущее состояние
      }
      // после авторизации перепроверим заказы
      checkHasOrders();
    });
    return () => unsub();
  }, []);

  // Реактивная подписка на заказы пользователя по обеим локациям
  useEffect(() => {
    const auth = getAuth();
    const current = auth.currentUser;
    if (!current) return;

    const locationIds = ['Kubenskoye-Lenina-Street', 'Vologda-Karla-Marksa-Street', 'Vologda-Fryazinovskaya-Street'];
    const unsubscribers = [];
    let hasActive = false;

    for (const locationId of locationIds) {
      const ordersRef = collection(db, 'locations', locationId, 'orders');
      const qy = query(ordersRef, where('userId', '==', current.uid));
      const unsub = onSnapshot(qy, (snapshot) => {
        let flag = false;
        snapshot.forEach((docSnap) => {
          const statusRaw = (docSnap.data()?.status || '').toString().trim().toLowerCase();
          const done = statusRaw === 'завершён' || statusRaw === 'завершен' || statusRaw === 'отменён' || statusRaw === 'отменен' || statusRaw === 'completed' || statusRaw === 'cancelled' || statusRaw === 'canceled';
          if (!done) flag = true;
        });
        hasActive = hasActive || flag;
        // Если в этой локации нет активных и ранее было true из другой, оставим true
        // Если обе локации дадут false, hasActive станет false после двух вызовов
        setHasOrders((prev) => flag || (prev && !flag));
      });
      unsubscribers.push(unsub);
    }

    return () => {
      unsubscribers.forEach((fn) => { try { fn(); } catch {} });
    };
  }, [getAuth().currentUser?.uid]);

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

  // При монтировании ждём готовность auth и реактивно проверяем заказы
  useEffect(() => {
    const onFocus = () => checkHasOrders();
    const onVisible = () => { if (document.visibilityState === 'visible') checkHasOrders(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <div className='app-container'>
      <Header
        userData={userData}
        location={effectiveLocation}
        isAdmin={isAdmin}
        isTerminal={isTerminal}
        cartCount={cartCount}
        adminRoles={adminRoles}
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
                  {isStopMarket && !isAdmin && !isTerminal ? (
                    <StopMarket />
                  ) : (
                    <Catalog
                      location={effectiveLocation}
                      cartCount={cartCount}
                      hasOrders={hasOrders}
                    />
                  )}
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
                    isAdmin={isAdmin}  
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
                  {isStopMarket && !isAdmin && !isTerminal ? (
                    <StopMarket />
                  ) : (
                    <Cart
                      location={effectiveLocation}
                      setCartCount={setCartCount}
                      isAdmin={isAdmin}
                      isTerminal={isTerminal}
                      userData={userData}
                    />
                  )}
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
            <Route path="/success-cash" element={<SuccessCash />} />
            <Route path="/fail-cash" element={<FailCash />} />
            <Route path="/admin/add-product" element={<AddProduct location={effectiveLocation} />} />
            <Route path="/closed" element={<ClosedScreen onClose={() => window.history.back()} />} />
          </Routes>
        </AnimatePresence>
      )}
    </div>
  );
}

export default AppWrapper;