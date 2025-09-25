import './AddProduct.css';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AddProduct({ location }) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!category || !name || !price) {
      setError('Заполните все обязательные поля');
      return;
    }
    let photoURL = '';
    try {
      if (file) {
        const storageRef = ref(storage, `products/${location}/${Date.now()}_${file.name}`);
        console.log('storageRef:', storageRef.fullPath);
        console.log('file:', file);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, `locations/${location}/products`), {
        category,
        name,
        price: Number(price),
        desc,
        photo: photoURL,
        paused: false,
        createdAt: new Date()
      });
      setSuccess('Товар добавлен!');
      setCategory('');
      setName('');
      setPrice('');
      setDesc('');
      setFile(null);
    } catch (err) {
      setError('Ошибка при добавлении товара');
    }
  };




  return (
    <div className="add-product">
      <h1>Добавить товар</h1>
      <form onSubmit={handleAdd}>

        <select className='select' value={category} onChange={e => setCategory(e.target.value)} required>
          <option value="">Выберите категорию</option>
          <option value="drinks">Напитки</option>
          <option value="appetizers">Закуски</option>
          <option value="desserts">Десерты</option>
          <option value="burgers">Бургеры</option>
          <option value="shawarma">Шаурма</option>
          <option value="sauces">Соусы</option>
          <option value="french-fries">Картофель </option>
          <option value="additionally">Дополнительно</option>
          <option value="hot-dogs">Хот-Доги</option>
          <option value="combo">Комбо</option>
          <option value="new">Новинки</option>
           <option value="delivery coupons">Купоны на доставку</option>
            <option value="company coupons">Купоны в предприятии</option>
        </select>

        <input
          type="text"
          placeholder="Название"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
        />
        <textarea
          placeholder="Описание"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
        />
        <button type="submit">Добавить</button>
      </form>
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}
      <NavLink to="/admin" className="admin-add-btn">
        В админ-панель
      </NavLink>
    </div>
  );
}

export default AddProduct;