
// import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
// import { useState, useEffect } from "react";
// export function useWorkingHours(openHour = 9, closeHour = 22, timezoneOffset = 3) {
//   // timezoneOffset — смещение в часах относительно UTC, для Москвы = 3
//   const [isOpen, setIsOpen] = useState(true);
//   const [serverTime, setServerTime] = useState(null);

//   useEffect(() => {
//     const fetchServerTime = async () => {
//       try {
//         const db = getFirestore();
//         const ref = doc(db, "meta", "serverTimeTemp");

//         // создаём документ с серверным временем
//         await setDoc(ref, { time: serverTimestamp() });

//         // читаем его обратно
//         const snap = await getDoc(ref);
//         const time = snap.data().time.toDate();
//         setServerTime(time);

//         // час по московскому времени
//         const hourUTC = time.getUTCHours();
//         const localHour = (hourUTC + timezoneOffset + 24) % 24;

//         setIsOpen(localHour >= openHour && localHour < closeHour);
//       } catch (e) {
//         console.error("Ошибка при получении серверного времени:", e);
//       }
//     };

//     fetchServerTime();

//     const interval = setInterval(fetchServerTime, 5 * 60 * 1000); // обновляем каждые 5 минут
//     return () => clearInterval(interval);
//   }, [openHour, closeHour, timezoneOffset]);

//   return { isOpen, serverTime };
// }



import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from "react";

function parseTimeString(timeStr) {
  // "10:30" → { hours: 10, minutes: 30 }
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

export function useWorkingHours({
  open = "09:00",
  close = "22:00",
  timezone = 3, // Москва по умолчанию
  intervalMinutes = 5
} = {}) {
  const [isOpen, setIsOpen] = useState(true);
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const db = getFirestore();
        const ref = doc(db, "meta", "serverTimeTemp");

        // Записываем время сервера
        await setDoc(ref, { time: serverTimestamp() });

        // Читаем назад
        const snap = await getDoc(ref);
        const time = snap.data().time.toDate();
        setServerTime(time);

        // --- ЛОГИКА ОПРЕДЕЛЕНИЯ ВРЕМЕНИ ---

        const utcHours = time.getUTCHours();
        const utcMinutes = time.getUTCMinutes();

        // Преобразуем UTC в локальное время по таймзоне
        const totalMinutesUTC = utcHours * 60 + utcMinutes;
        const totalMinutesLocal = (totalMinutesUTC + timezone * 60 + 1440) % 1440;

        // Парсим строковое время
        const { hours: openH, minutes: openM } = parseTimeString(open);
        const { hours: closeH, minutes: closeM } = parseTimeString(close);

        const openTotal = openH * 60 + openM;
        const closeTotal = closeH * 60 + closeM;

        // Проверяем, открыто ли заведение
        const openNow =
          openTotal < closeTotal
            ? totalMinutesLocal >= openTotal && totalMinutesLocal < closeTotal
            : // случай, если магазин работает через полночь, например 22:00–06:00
              totalMinutesLocal >= openTotal || totalMinutesLocal < closeTotal;

        setIsOpen(openNow);
      } catch (e) {
        console.error("Ошибка при получении серверного времени:", e);
      }
    };

    fetchServerTime();
    const interval = setInterval(fetchServerTime, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [open, close, timezone, intervalMinutes]);

  return { isOpen, serverTime };
}
