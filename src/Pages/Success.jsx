
import { useNavigate } from 'react-router-dom';
import './Success.css';

export default function Success() {
  const navigate = useNavigate();
  return (
    <div className='success'>
      <h1>Оплата прошла успешно!</h1>
      <button className='btn' onClick={() => navigate('/')}>К каталогу товаров</button>
    </div>
  );
}