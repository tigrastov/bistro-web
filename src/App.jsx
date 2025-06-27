import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Catalog from './Pages/Catalog';
import Orders from './Pages/Orders';
import Info from './Pages/Info';
import Cart from './Pages/Cart';
import Profile from './Pages/Profile';
import DetailView from './Pages/DetailView.jsx';
import Auth from './Pages/Auth.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className='app-container'>
        <Header />
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/info" element={<Info />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/product/:id" element={<DetailView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
