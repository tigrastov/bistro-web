import React from 'react';
import './Fail.css';
export default function Fail() {
return (
    <div className='fail'>
      <h1>Оплата не прошла. Попробуйте снова</h1>
      <button className='btn' onClick={() => window.location.href = '/'}>К каталогу товаров</button>
    </div>
  );
}