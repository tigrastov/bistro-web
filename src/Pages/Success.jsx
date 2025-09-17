import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Success.css";
export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // Теперь заказ создаётся/обновляется на сервере (вебхук)
    localStorage.removeItem("cart");
    localStorage.removeItem("currentOrder");
  }, []);

  return (
    <div className="success">
  <h1>Ваш заказ успешно оплачен!</h1>
  <h2>Спасибо за покупку. Мы обрабатываем ваш заказ.</h2>
  <button className="btn" onClick={() => navigate("/")}>К каталогу товаров</button>
</div>
  );
}