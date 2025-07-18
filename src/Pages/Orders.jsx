import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(orders.length / itemsPerPage);

const goToNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

const goToPrevPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};

  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const locationIds = ['Kubenskoye-Lenina-Street', 'Vologda-Karla-Marksa-Street'];
        const allOrders = [];

        for (const locationId of locationIds) {
          const ordersRef = collection(db, 'locations', locationId, 'orders');
          const q = query(ordersRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc) => {
            allOrders.push({
              id: doc.id,
              location: locationId,
              ...doc.data(),
            });
          });
        }

        allOrders.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setOrders(allOrders);
      } catch (error) {
        console.error('Ошибка при получении заказов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [auth.currentUser, db]);

  if (loading) {
    return <p className="orders-loading">Загрузка заказов...</p>;
  }

  if (orders.length === 0) {
    return <p className="orders-empty">У вас пока нет заказов.</p>;
  }


  return (
  <div className="orders">


    <ul className="orders-list">
      {currentOrders.map((order) => (
        <li key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-location">Торговая точка: {order.location}</span>
            <span className="order-date">
              {order.createdAt
                ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                : 'Дата неизвестна'}
            </span>
          </div>
          <div className="order-info">
            <p className='status-field'>Статус: <strong >{order.status || 'новый'}</strong></p>
            <p>Сумма: <strong>{order.total} ₽</strong></p>
          </div>
          <ul className="order-items">
            {order.items.map((item, index) => (
              <li key={index} className="order-item">
                {item.name} × {item.quantity} — {item.price * item.quantity} ₽
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>

    <div className="pagination">
      <button onClick={goToPrevPage} disabled={currentPage === 1}>
        Назад
      </button>
      <span>Страница {currentPage} из {totalPages}</span>
      <button onClick={goToNextPage} disabled={currentPage === totalPages}>
        Вперёд
      </button>
    </div>
  </div>
);

}
export default Orders;
