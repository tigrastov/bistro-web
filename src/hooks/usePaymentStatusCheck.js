import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

/**
 * Хук для проверки статуса оплаты заказа при возврате приложения в фокус
 * 
 * Решает проблему, когда пользователь:
 * 1. Начинает оплату в приложении
 * 2. Банк открывает Safari для оплаты
 * 3. После оплаты пользователь возвращается в приложение
 * 4. Приложение автоматически проверяет статус заказа на сервере
 * 5. Если заказ оплачен - очищает корзину и редиректит на /success
 * 
 * Работает через:
 * - visibilitychange - когда приложение становится видимым
 * - focus - когда окно получает фокус
 * - При монтировании компонента
 * 
 * Использование: просто добавьте usePaymentStatusCheck() в App.jsx
 */
export function usePaymentStatusCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    let isChecking = false; // Флаг для предотвращения параллельных проверок

    const checkOrderStatus = async () => {
      // Предотвращаем параллельные проверки
      if (isChecking) return;
      isChecking = true;

      try {
        // Проверяем, есть ли незавершенный заказ в localStorage
        const lastOrderId = localStorage.getItem('lastOrderId');
        const lastOrderLocation = localStorage.getItem('lastOrderLocation');
        const lastOrderNumber = localStorage.getItem('lastOrderNumber');

        if (!lastOrderId || !lastOrderLocation) {
          isChecking = false;
          return;
        }

        // Проверяем статус заказа в Firestore
        const db = getFirestore();
        const orderRef = doc(db, 'locations', lastOrderLocation, 'orders', lastOrderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          // Заказ не найден - возможно был удален или еще не создан
          isChecking = false;
          return;
        }

        const orderData = orderSnap.data();
        const status = (orderData?.status || '').toString().toLowerCase();

        // Проверяем, оплачен ли заказ
        const isPaid = status === 'оплачено' || 
                      status === 'оплачен' || 
                      status === 'paid' ||
                      status === 'оплата наличными';

        if (isPaid) {
          // Заказ оплачен! Очищаем localStorage и корзину
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('lastOrderNumber');
          localStorage.removeItem('lastOrderLocation');
          localStorage.removeItem('cart');
          localStorage.removeItem('currentOrder');

          // Обновляем флаг заказов
          localStorage.setItem('hasOrders', '1');
          window.dispatchEvent(new Event('orders-changed'));
          window.dispatchEvent(new Event('cart-changed'));

          // Редирект на страницу успеха
          navigate('/success', { replace: true });
        } else if (status === 'отклонено' || status === 'declined' || status === 'failed') {
          // Заказ отклонен - очищаем и редиректим на fail
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('lastOrderNumber');
          localStorage.removeItem('lastOrderLocation');
          localStorage.removeItem('currentOrder');

          navigate('/fail', { replace: true });
        }
        // Если статус "ожидает оплаты" - ничего не делаем, пользователь может попробовать снова
      } catch (error) {
        console.error('Ошибка при проверке статуса заказа:', error);
      } finally {
        isChecking = false;
      }
    };

    // Проверяем статус при возврате приложения в фокус
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Небольшая задержка, чтобы дать время приложению полностью загрузиться
        // и серверу обработать webhook от банка
        setTimeout(checkOrderStatus, 1000);
      }
    };

    // Проверяем статус при фокусе окна
    const handleFocus = () => {
      setTimeout(checkOrderStatus, 1000);
    };

    // Проверяем статус при монтировании компонента (если пользователь уже в приложении)
    // Задержка нужна, чтобы дать время Firebase инициализироваться
    const initialCheck = setTimeout(() => {
      checkOrderStatus();
    }, 1000);

    // Подписываемся на события
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Очистка при размонтировании
    return () => {
      clearTimeout(initialCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);
}

