// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { motion, AnimatePresence } from "framer-motion";
// import Header from './Components/Header';
// import Catalog from './Pages/Catalog';
// import Orders from './Pages/Orders';
// import Info from './Pages/Info';
// import Cart from './Pages/Cart';
// import Profile from './Pages/Profile';
// import DetailView from './Pages/DetailView.jsx';
// import Auth from './Pages/Auth.jsx';
// import AdminPanel from './Pages/AdminPanel.jsx'; 
// import './App.css';
// import { useState, useEffect } from 'react';
// import LocationSelect from './Components/LocationSelect.jsx'; 
// import AddProduct from './Pages/AddProduct.jsx';
// import Success from './Pages/Success.jsx';
// import Fail from './Pages/Fail.jsx';


// function App() {
//   const [userData, setUserData] = useState(null);
//   const [location, setLocation] = useState(() => localStorage.getItem("location") || "");
//   const [cartCount, setCartCount] = useState(0);

//   const isAdminCuba = userData?.role === 'adminCuba';
//   const isAdminKarlMarks = userData?.role === 'adminKarlMarks';
//   const isAdmin = isAdminCuba || isAdminKarlMarks;


//   const effectiveLocation = isAdminCuba
//     ? 'Kubenskoye-Lenina-Street'
//     : isAdminKarlMarks
//       ? 'Vologda-Karla-Marksa-Street'
//       : location;

//   const handleLocationSelect = (loc) => {
//     setLocation(loc);
//     localStorage.setItem("location", loc);
//   };


//   useEffect(() => {
//     const updateCartCount = () => {
//       const cart = JSON.parse(localStorage.getItem('cart')) || [];
//       const count = cart.reduce((sum, item) => sum + item.quantity, 0); 
//       setCartCount(count);
//     };

//     updateCartCount();


//     window.addEventListener('storage', updateCartCount);

//     return () => {
//       window.removeEventListener('storage', updateCartCount);
//     };
//   }, []);
//   return (
//     <Router>
//       <div className='app-container'>
//         <Header
//           userData={userData}
//           location={effectiveLocation}
//           isAdmin={isAdmin}
//           cartCount={cartCount}
//           onChangeLocation={() => {
//             setLocation("");
//             localStorage.removeItem("location");
//           }}
//         />

//         {!effectiveLocation && !isAdmin ? (
//           <LocationSelect onSelect={handleLocationSelect} />
//         ) : (


//           <Routes>
//             <Route path="/" element={<Catalog location={effectiveLocation} />} />
//             <Route path="/cart"element={<Cart location={effectiveLocation} setCartCount={setCartCount} />}/>
//             <Route path="/orders" element={<Orders location={effectiveLocation} />} />
//             <Route path="/info" element={<Info />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/auth" element={<Auth setUserData={setUserData} />} />
//             <Route path="/admin" element={<AdminPanel location={effectiveLocation}userData={userData} />


// } />
//             <Route path="/success" element={<Success />} />
//             <Route path="/fail" element={<Fail />} />
//             <Route
//   path="/product/:id"
//   element={
//     <DetailView
//       location={effectiveLocation}
//       userData={userData}
//       setCartCount={setCartCount}
//     />
//   }
// />

//             {/* <Route path="/admin" element={<AdminPanel />} /> */}

//             {/* <Route path="/product/:id" element={<DetailView />} /> */}
//             {/* <Route path="/admin/add-product" element={<AddProduct />} /> */}
//             <Route path="/admin/add-product" element={<AddProduct location={effectiveLocation} />} />
//             <Route
//            path="/product/:id"
//            element={
//          <DetailView
//       location={effectiveLocation}
//       userData={userData}
//       setCartCount={setCartCount}
//     />
//   }
// />
//           </Routes>
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;


import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';

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

  const isAdminCuba = userData?.role === 'adminCuba';
  const isAdminKarlMarks = userData?.role === 'adminKarlMarks';
  const isAdmin = isAdminCuba || isAdminKarlMarks;

  const effectiveLocation = isAdminCuba
    ? 'Kubenskoye-Lenina-Street'
    : isAdminKarlMarks
      ? 'Vologda-Karla-Marksa-Street'
      : locationState;

  const handleLocationSelect = (loc) => {
    setLocationState(loc);
    localStorage.setItem("location", loc);
  };

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  return (
    <div className='app-container'>
      <Header
        userData={userData}
        location={effectiveLocation}
        isAdmin={isAdmin}
        cartCount={cartCount}
        onChangeLocation={() => {
          setLocationState("");
          localStorage.removeItem("location");
        }}
      />

      {!effectiveLocation && !isAdmin ? (
        <LocationSelect onSelect={handleLocationSelect} />
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* Каталог с лёгкой анимацией */}
            <Route
              path="/"
              element={
                <motion.div

                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: [1, 0, 1, 1] }}
                >
                  <Catalog location={effectiveLocation} cartCount={cartCount} />
                </motion.div>
              }
            />

            {/* DetailView с анимацией «из точки» */}
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

            {/* Остальные роуты без анимации */}
            <Route
              path="/cart"
              element={
                <motion.div
                  initial={{ opacity: 0, y: -40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -40, scale: 0.95 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.42, 0, 0.58, 1], // медленный старт, плавное ускорение
                  }}
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
                  transition={{
                    duration: 0.7,
                    ease: [0.42, 0, 0.58, 1], // медленный старт, плавное ускорение
                  }}
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
                  transition={{
                    duration: 0.6,
                    ease: [0.42, 0, 0.58, 1], // плавный старт и мягкое ускорение
                  }}
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
                  transition={{
                    duration: 0.6,
                    ease: [0.42, 0, 0.58, 1], // мягкий старт и плавное ускорение
                  }}
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