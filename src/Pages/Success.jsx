

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Success.css";

// export default function Success() {
//   const navigate = useNavigate();
//   const [orderNumber, setOrderNumber] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedOrderNumber = localStorage.getItem("lastOrderNumber");
//     if (savedOrderNumber) setOrderNumber(savedOrderNumber);

//     localStorage.removeItem("cart");
//     localStorage.removeItem("lastOrderNumber");

//     localStorage.setItem("hasOrders", "1");
//     window.dispatchEvent(new Event("orders-changed"));

//     setLoading(false);
//   }, []);



//   if (loading) {
//     return (
//       <div className="success">
//         <h2>Загрузка информации о заказе...</h2>
//       </div>
//     );
//   }

//   return (
//     <div className="success">
//       <h1 className="info">Ваш заказ успешно оплачен!</h1>

//       {orderNumber && (
//         <h2 className="number-text">Номер вашего заказа: <strong className="number">{orderNumber}</strong></h2>
//       )}

//       <p>Спасибо за покупку! Мы уже обрабатываем ваш заказ.</p>

//       <button className="btn-success" onClick={() => navigate("/")}>
//         Вернуться на главную
//       </button>

//       <div className="success-message">
//         <div className="success-message-inner">
//           <h1>
//             Не оплачивайте заказ повторно, он уже оплачен!!!
//           </h1>
//         </div>
//         <p>
//           Если вы сделали заказ в мобильном приложении, и вас перебросило на сайт, то не перживайте
//           - ваш заказ обрабатыватся. Вы можете снова открыть приложение Нажать: "Отменить оплату",  "Очистить корзину". А в разделе "мои заказы" отслеживать статус заказа.
//         </p>

//       </div>

//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Success.css";

export default function Success() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lastOrderNumber");
    setOrderNumber(saved || null);

    localStorage.removeItem("cart");
    localStorage.removeItem("lastOrderNumber");

    // ДЕЛАЕМ ТОЛЬКО 1 РЕНДЕР!
    Promise.resolve().then(() => {
      localStorage.setItem("hasOrders", "1");
      window.dispatchEvent(new Event("orders-changed"));
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="success">
        <h2>Загрузка информации о заказе...</h2>
      </div>
    );
  }

  return (
    <div className="success">
      <h1 className="info">Ваш заказ успешно оплачен!</h1>

      {orderNumber && (
        <h2 className="number-text">
          Номер вашего заказа: <strong className="number">{orderNumber}</strong>
        </h2>
      )}

      <p>Спасибо за покупку! Мы уже обрабатываем ваш заказ.</p>

      <button className="btn-success" onClick={() => navigate("/")}>
        Вернуться на главную страницу
      </button>

      <div className="success-message">
        <div className="success-message-inner">
          <h1>Не оплачивайте заказ повторно, он уже оплачен!!!</h1>
        </div>
        <p>
          Если вы сделали заказ в приложении и вас перебросило на сайт — всё нормально. 
          Заказ обрабатывается. В приложении нажмите «Отменить оплату» или «Очистить корзину». 
          Статус заказа смотрите в «Мои заказы».
        </p>
      </div>
    </div>
  );
}
