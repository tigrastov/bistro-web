// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCshf3tTy8liWMY5pWU55b9mRcDBiU8LBI",
//   authDomain: "bistro-1c086.firebaseapp.com",
//   projectId: "bistro-1c086",
//   storageBucket: "bistro-1c086.firebasestorage.app",
//   messagingSenderId: "41816572785",
//   appId: "1:41816572785:web:da41297c9487518db72cd0"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// Инициализация Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCshf3tTy8liWMY5pWU55b9mRcDBiU8LBI",
  authDomain: "bistro-1c086.firebaseapp.com",
  projectId: "bistro-1c086",
  storageBucket: "bistro-1c086.appspot.com",
  messagingSenderId: "41816572785",
  appId: "1:41816572785:web:da41297c9487518db72cd0"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем нужные сервисы
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;