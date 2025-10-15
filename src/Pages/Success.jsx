// import { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// import "./Success.css";
// export default function Success() {
//   const navigate = useNavigate();
//   const [orderNumber, setOrderNumber] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Теперь заказ создаётся/обновляется на сервере (вебхук)
//     localStorage.removeItem("cart");
//     localStorage.removeItem("currentOrder");

//     // отмечаем наличие заказов, чтобы сразу показать иконку
//     localStorage.setItem('hasOrders', '1');
//     window.dispatchEvent(new Event('orders-changed'));


//   }, []);

//   return (
//     <div className="success">
//       <h1>Ваш заказ успешно оплачен!</h1>

//       <h2>Спасибо за покупку. Мы обрабатываем ваш заказ.</h2>
//       <button className="btn-success" onClick={() => navigate("/")}>К каталогу товаров</button>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Success.css";

export default function Success() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const savedOrderNumber = localStorage.getItem("lastOrderNumber");
  if (savedOrderNumber) setOrderNumber(savedOrderNumber);

  localStorage.removeItem("cart");
  localStorage.removeItem("lastOrderNumber");

  localStorage.setItem("hasOrders", "1");
  window.dispatchEvent(new Event("orders-changed"));

  setLoading(false);
}, []);



  if (loading) {
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
        <h2 className="number-text">Номер вашего заказа: <strong className="number">{orderNumber}</strong></h2>
      )}

      <p>Спасибо за покупку! Мы уже обрабатываем ваш заказ.</p>

      <button className="btn-success" onClick={() => navigate("/")}>
        Вернуться на главную
      </button>
    </div>
  );
}
