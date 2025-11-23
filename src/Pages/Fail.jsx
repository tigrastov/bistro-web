// import { useNavigate } from 'react-router-dom';
// import './Fail.css';
// export default function Fail() {
//   const naigate = useNavigate();
// return (
//     <div className='fail'>
//       <h1>Оплата не прошла. Попробуйте снова</h1>
//       <button className='btn-fail' onClick={() => naigate('/')}>К каталогу товаров</button>
//     </div>
//   );
// }




import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Fail.css";

export default function Fail() {
  const navigate = useNavigate();

  useEffect(() => {
    const ua = navigator.userAgent || "";

    const isIOS =
      /iPhone|iPad|iPod/.test(ua) && !ua.includes("Safari");

    const isAndroid =
      ua.includes("wv") || (ua.includes("Android") && ua.includes("Version"));

    // Выполняем редирект НЕ ВО ВРЕМЯ РЕНДЕРА!
    setTimeout(() => {
      if (isIOS || isAndroid) {
        window.location.replace("myapp://payment-fail");
      }
    }, 100);
  }, []);

  return (
    <div className="fail">
      <h1>Оплата не прошла. Попробуйте снова</h1>
      <button className="btn-fail" onClick={() => navigate("/")}>
        К каталогу товаров
      </button>
    </div>
  );
}
