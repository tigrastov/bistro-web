import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserData(snap.data());
      }
      setLoading(false); 
    };
    fetchProfile();
  }, []);

 
  if (loading) return <div className="profile"><h1>Профиль</h1><p>Загрузка...</p></div>;

  if (!auth.currentUser) {
    return (
      <div className="profile">
        <h1>Профиль</h1>
        <button onClick={() => navigate('/auth')} className="auth-btn">
          Войти или зарегистрироваться
        </button>
      </div>
    );
  }

  if (!userData) return <div className="profile"><h1>Профиль</h1><p>Загрузка...</p></div>;

  return (
    <div className="profile">
      <h1>Профиль</h1>
      <p>Email: {userData.email}</p>
      <p>Имя: {userData.name}</p>
      <p>Телефон: {userData.phone}</p>
    </div>
  );
}

export default Profile;