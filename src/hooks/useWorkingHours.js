
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
export function useWorkingHours(openHour = 9, closeHour = 22, timezoneOffset = 3) {
  // timezoneOffset — смещение в часах относительно UTC, для Москвы = 3
  const [isOpen, setIsOpen] = useState(true);
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const db = getFirestore();
        const ref = doc(db, "meta", "serverTimeTemp");

        // создаём документ с серверным временем
        await setDoc(ref, { time: serverTimestamp() });

        // читаем его обратно
        const snap = await getDoc(ref);
        const time = snap.data().time.toDate();
        setServerTime(time);

        // час по московскому времени
        const hourUTC = time.getUTCHours();
        const localHour = (hourUTC + timezoneOffset + 24) % 24;

        setIsOpen(localHour >= openHour && localHour < closeHour);
      } catch (e) {
        console.error("Ошибка при получении серверного времени:", e);
      }
    };

    fetchServerTime();

    const interval = setInterval(fetchServerTime, 5 * 60 * 1000); // обновляем каждые 5 минут
    return () => clearInterval(interval);
  }, [openHour, closeHour, timezoneOffset]);

  return { isOpen, serverTime };
}
