

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
