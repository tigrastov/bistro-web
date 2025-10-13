import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { NavLink } from 'react-router-dom';

import './AdminPanel.css';

function AdminPanel({ location, userData }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(5); // Default for mobile

  const auth = getAuth();
  const db = getFirestore();

  const [showBell, setShowBell] = useState(false);


  // Responsive orders per page
  useEffect(() => {
    const handleResize = () => {
      setOrdersPerPage(window.innerWidth > 768 ? 10 : 5);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);





  // useEffect(() => {
  //   if (!location || !userData) {
  //     console.warn('Нет локации или данных пользователя');
  //     return;
  //   }

  //   const ordersRef = collection(db, 'locations', location, 'orders');
  //   const q = query(ordersRef, orderBy('createdAt', 'desc'));

  //   let prevOrderIds = new Set(); // запомним старые заказы
  //   let notificationActive = false;
  //   const audio = new Audio('/sounds/notify.mp3');

  //   const unsubscribe = onSnapshot(
  //     q,
  //     (snapshot) => {
  //       const updatedOrders = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));

  //       // проверяем новые заказы
  //       const newOrders = updatedOrders.filter((o) => !prevOrderIds.has(o.id));

  //       if (prevOrderIds.size > 0 && newOrders.length > 0 && !notificationActive) {
  //         notificationActive = true;

  //         // 🔔 звук
  //         audio.play().catch(() => { });

  //         // 🔴 мигание вкладки
  //         const originalTitle = document.title;
  //         let flash = true;
  //         const interval = setInterval(() => {
  //           document.title = flash ? '🛒 Новый заказ!' : originalTitle;
  //           flash = !flash;
  //         }, 1000);

  //         // прекращаем мигание при активности
  //         const stopNotification = () => {
  //           clearInterval(interval);
  //           document.title = originalTitle;
  //           notificationActive = false;
  //           window.removeEventListener('focus', stopNotification);
  //           window.removeEventListener('click', stopNotification);
  //         };

  //         window.addEventListener('focus', stopNotification);
  //         window.addEventListener('click', stopNotification);
  //       }

  //       prevOrderIds = new Set(updatedOrders.map((o) => o.id));
  //       setOrders(updatedOrders.filter(order => order.status !== 'ожидает оплаты'));
  //       setLoading(false);
  //     },
  //     (error) => {
  //       console.error('Ошибка при получении заказов:', error);
  //       setLoading(false);
  //     }
  //   );

  //   return () => unsubscribe();
  // }, [location, userData, db]);



  useEffect(() => {
    if (!location || !userData) {
      console.warn('Нет локации или данных пользователя');
      return;
    }

    const ordersRef = collection(db, 'locations', location, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    let prevStatuses = new Map(); // 💾 id → предыдущий статус
    let notificationActive = false;
    const audio = new Audio('/sounds/notify.mp3');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 💡 Ищем заказы, у которых статус изменился на "оплачен" или "оплачено"
        const newlyPaid = updatedOrders.filter((order) => {
          const prevStatus = prevStatuses.get(order.id);
          return (
            prevStatus && // был известен предыдущий статус
            prevStatus !== order.status && // статус изменился
            (order.status?.toLowerCase() === 'оплачен' ||
              order.status?.toLowerCase() === 'оплачено')
          );
        });

        // 🔔 Только если появились новые "оплаченные" заказы
        if (prevStatuses.size > 0 && newlyPaid.length > 0 && !notificationActive) {
          notificationActive = true;

          // 🔊 звук
          audio.play().catch(() => { });

          setShowBell(true);


          // 🪩 мигание вкладки
          const originalTitle = document.title;
          let flash = true;
          const interval = setInterval(() => {
            document.title = flash ? '💸 Новый оплаченный заказ!' : originalTitle;
            flash = !flash;
          }, 1000);

          // 🧩 прекращаем мигание при активности
          const stopNotification = () => {
            clearInterval(interval);
            document.title = originalTitle;
            notificationActive = false;
            window.removeEventListener('focus', stopNotification);
            window.removeEventListener('click', stopNotification);

            setShowBell(false);

          };

          window.addEventListener('focus', stopNotification);
          window.addEventListener('click', stopNotification);
        }

        // 💾 Запоминаем текущие статусы заказов
        prevStatuses = new Map(updatedOrders.map((o) => [o.id, o.status]));

        // 🧹 Показываем только заказы, не находящиеся в статусе "ожидает оплаты"
        setOrders(updatedOrders.filter(order => order.status?.toLowerCase() !== 'ожидает оплаты'));
        setLoading(false);
      },
      (error) => {
        console.error('Ошибка при получении заказов:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [location, userData, db]);



  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'locations', location, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (loading) return <p className="admin-loading">Загрузка заказов...</p>;

  return (
    <div className="admin-orders">


      {showBell && (
        <div className="admin-bell">
          🔔 Новый оплаченный заказ!
        </div>
      )}




      <h1 className="admin-title">Заказы вашего магазина</h1>


      <div className="admin-add-product-wrapper">
        <NavLink to="/admin/add-product" className="admin-add-btn">
          ➕ Добавить товар
        </NavLink>
      </div>


      <div className="admin-status-tabs">
        <button onClick={() => setSelectedStatus('all')} className={selectedStatus === 'all' ? 'active' : ''}>Все</button>
        <button onClick={() => setSelectedStatus('новый')} className={selectedStatus === 'новый' ? 'active' : ''}>Новые</button>
        <button onClick={() => setSelectedStatus('в обработке')} className={selectedStatus === 'в обработке' ? 'active' : ''}>В обработке</button>
        <button onClick={() => setSelectedStatus('доставка')} className={selectedStatus === 'доставка' ? 'active' : ''}>Доставка</button>
        <button onClick={() => setSelectedStatus('завершён')} className={selectedStatus === 'завершён' ? 'active' : ''}>Завершён</button>
        <button onClick={() => setSelectedStatus('отменён')} className={selectedStatus === 'отменён' ? 'active' : ''}>Отменён</button>
      </div>

      {currentOrders.length === 0 ? (
        <p className="admin-empty">Заказов пока нет</p>
      ) : (
        <ul className="admin-order-list">
          {currentOrders.map((order) => (
            <li key={order.id} className="admin-order-card">
              <div className="admin-order-header">
                <span><strong>Заказ #{order.orderNumber ? String(order.orderNumber).padStart(4, '0') : order.id}</strong></span>
                <span>Пользователь: {order.userName || 'Неизвестно'}</span>
                <span>Телефон: {order.userPhone || 'Неизвестно'}</span>
                <span>
                  {order.createdAt
                    ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                    : 'Дата неизвестна'}
                </span>
              </div>
              <div className="admin-order-info">
                <p>Статус: <strong>{order.status || 'новый'}</strong></p>
                <p>Сумма: <strong>{order.total} ₽</strong></p>


                <select
                  value={order.status || 'новый'}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  style={{
                    backgroundColor:
                      order.status === 'новый'
                        ? '#e74c3c'
                        : order.status === 'в обработке'
                          ? '#3498db'
                          : order.status === 'доставка'
                            ? '#f1c40f'
                            : order.status === 'завершён'
                              ? '#2ecc71'
                              : order.status === 'отменён'
                                ? '#7f8c8d'
                                : '#e74c3c',
                    color:
                      order.status === 'доставка'
                        ? '#0A0002'
                        : '#fff',
                  }}
                  className="status-select"
                >
                  <option value="новый">новый</option>
                  <option value="в обработке">в обработке</option>
                  <option value="доставка">доставка</option>
                  <option value="завершён">завершён</option>
                  <option value="отменён">отменён</option>
                </select>





              </div>
              <ul className="admin-order-items">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.quantity} = {item.price * item.quantity} ₽
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Назад</button>
          <span>Страница {currentPage} из {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Вперёд</button>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
