import { useNavigate } from 'react-router-dom';
import './Fail.css';
export default function Fail() {
  const naigate = useNavigate();
return (
    <div className='fail'>
      <h1>Оплата не прошла. Попробуйте снова</h1>
      <button className='btn' onClick={() => naigate('/')}>К каталогу товаров</button>
    </div>
  );
}