import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserData(snap.data());
      }
    };
    fetchProfile();
  }, []);

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