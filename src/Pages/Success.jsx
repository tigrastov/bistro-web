import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Success.css";
export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    async function saveOrder() {
      const order = JSON.parse(localStorage.getItem("currentOrder"));
      if (!order) return;

      try {
        const db = getFirestore();
        await addDoc(collection(db, "locations", order.location, "orders"), {
          userId: order.userId,
          userName: order.clientName,
          userPhone: order.userPhone,
          items: order.items,
          total: order.totalAmount,
          createdAt: serverTimestamp(),
          status: "новый",
        });

        // чистим корзину и временные данные
        localStorage.removeItem("cart");
        localStorage.removeItem("currentOrder");

        //alert("Заказ успешно сохранён!");
      } catch (error) {
        console.error("Ошибка при сохранении оплаченного заказа:", error);
        alert("Не удалось сохранить заказ. Свяжитесь с поддержкой.");
      }
    }

    saveOrder();
  }, []);

  return (
    <div className="success">
  <h1>Ваш заказ успешно оплачен!</h1>
  <h2>Спасибо за покупку. Мы обрабатываем ваш заказ.</h2>
  <button className="btn" onClick={() => navigate("/")}>К каталогу товаров</button>
</div>
  );
}