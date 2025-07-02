
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCkvL8pAuXjVVXO7FEKqCdUX4Y6V2ZHbto",
  authDomain: "bistro-app-acfb4.firebaseapp.com",
  projectId: "bistro-app-acfb4",
  storageBucket: "bistro-app-acfb4.firebasestorage.app",
  messagingSenderId: "332029498367",
  appId: "1:332029498367:web:0bfc6cf5f9a3c75e54cdca"
};


// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем нужные сервисы
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;