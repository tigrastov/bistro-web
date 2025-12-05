import { useEffect, useRef } from 'react';
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
 * Улучшения:
 * - Несколько попыток проверки с интервалом (на случай задержки webhook)
 * - Проверка при загрузке страницы
 * - Более надежная логика с retry
 */
export function usePaymentStatusCheck() {
  const navigate = useNavigate();
  const checkTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const MAX_RETRIES = 5; // Максимум 5 попыток
    const RETRY_DELAY = 2000; // 2 секунды между попытками
    const INITIAL_DELAY = 1500; // Начальная задержка 1.5 секунды

    const checkOrderStatus = async (isRetry = false) => {
      // Предотвращаем параллельные проверки
      if (isProcessingRef.current) {
        return;
      }

      // Проверяем, есть ли незавершенный заказ в localStorage
      const lastOrderId = localStorage.getItem('lastOrderId');
      const lastOrderLocation = localStorage.getItem('lastOrderLocation');

      if (!lastOrderId || !lastOrderLocation) {
        retryCountRef.current = 0;
        return;
      }

      // Если это не первая попытка и мы уже много раз проверяли - останавливаемся
      if (isRetry && retryCountRef.current >= MAX_RETRIES) {
        retryCountRef.current = 0;
        isProcessingRef.current = false;
        return;
      }

      isProcessingRef.current = true;

      try {
        // Проверяем статус заказа в Firestore
        const db = getFirestore();
        const orderRef = doc(db, 'locations', lastOrderLocation, 'orders', lastOrderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          // Заказ не найден - возможно был удален или еще не создан
          retryCountRef.current = 0;
          isProcessingRef.current = false;
          return;
        }

        const orderData = orderSnap.data();
        const status = (orderData?.status || '').toString().toLowerCase().trim();

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

          retryCountRef.current = 0;
          isProcessingRef.current = false;

          // Редирект на страницу успеха
          navigate('/success', { replace: true });
          return;
        }

        // Проверяем, отклонен ли заказ
        const isDeclined = status === 'отклонено' || 
                          status === 'declined' || 
                          status === 'failed' ||
                          status === 'отменено';

        if (isDeclined) {
          // Заказ отклонен - очищаем и редиректим на fail
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('lastOrderNumber');
          localStorage.removeItem('lastOrderLocation');
          localStorage.removeItem('currentOrder');

          retryCountRef.current = 0;
          isProcessingRef.current = false;

          navigate('/fail', { replace: true });
          return;
        }

        // Если статус "ожидает оплаты" - делаем повторную попытку
        if (status === 'ожидает оплаты' || status === 'pending' || status === 'waiting') {
          retryCountRef.current++;
          isProcessingRef.current = false;

          // Если еще не достигли максимума попыток - повторяем через RETRY_DELAY
          if (retryCountRef.current < MAX_RETRIES) {
            checkTimeoutRef.current = setTimeout(() => {
              checkOrderStatus(true);
            }, RETRY_DELAY);
          } else {
            // Превысили лимит попыток - сбрасываем счетчик
            retryCountRef.current = 0;
          }
          return;
        }

        // Неизвестный статус - сбрасываем счетчик
        retryCountRef.current = 0;
        isProcessingRef.current = false;

      } catch (error) {
        console.error('Ошибка при проверке статуса заказа:', error);
        retryCountRef.current++;
        isProcessingRef.current = false;

        // При ошибке тоже делаем повторную попытку
        if (retryCountRef.current < MAX_RETRIES) {
          checkTimeoutRef.current = setTimeout(() => {
            checkOrderStatus(true);
          }, RETRY_DELAY);
        } else {
          retryCountRef.current = 0;
        }
      }
    };

    // Проверяем статус при возврате приложения в фокус
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Сбрасываем счетчик при новом возврате
        retryCountRef.current = 0;
        
        // Очищаем предыдущий таймаут если есть
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }

        // Проверяем с начальной задержкой
        checkTimeoutRef.current = setTimeout(() => {
          checkOrderStatus(false);
        }, INITIAL_DELAY);
      }
    };

    // Проверяем статус при фокусе окна
    const handleFocus = () => {
      retryCountRef.current = 0;
      
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(() => {
        checkOrderStatus(false);
      }, INITIAL_DELAY);
    };

    // Проверяем статус при загрузке страницы (page load)
    const handlePageLoad = () => {
      retryCountRef.current = 0;
      
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(() => {
        checkOrderStatus(false);
      }, INITIAL_DELAY);
    };

    // Проверяем статус при монтировании компонента
    // Задержка нужна, чтобы дать время Firebase инициализироваться
    const initialCheck = setTimeout(() => {
      checkOrderStatus(false);
    }, INITIAL_DELAY);

    // Проверяем при загрузке страницы
    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
    }

    // Подписываемся на события
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Очистка при размонтировании
    return () => {
      clearTimeout(initialCheck);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      window.removeEventListener('load', handlePageLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);
}

