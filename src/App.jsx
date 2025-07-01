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
import { useState } from 'react';

function App() {

   const [userData, setUserData] = useState(null);

  return (
    <Router>
      <div className='app-container'>
        <Header userData={userData} />
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/info" element={<Info />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth setUserData={setUserData} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/product/:id" element={<DetailView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
