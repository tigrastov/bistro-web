import React from 'react';
import './Success.css';

export default function Success() {
  return (
    <div className='success'>
      <h1>Оплата прошла успешно!</h1>
      <button className='btn' onClick={() => window.location.href = '/'}>К каталогу товаров</button>
    </div>
  );
}