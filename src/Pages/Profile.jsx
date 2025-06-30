import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, deleteUser } from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
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

  // При входе в режим редактирования заполняем поле
  useEffect(() => {
    if (editMode && userData) {
      setEditPhone(userData.phone || '');
    }
  }, [editMode, userData]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    await signOut(auth);
    setShowLogoutDialog(false);
    navigate('/auth');
  };

  const confirmDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
      }
      setShowLogoutDialog(false);
      navigate('/auth');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Для удаления аккаунта нужно заново войти. Пожалуйста, выйдите и войдите снова.');
      } else {
        setError('Ошибка при удалении аккаунта: ' + (err.message || ''));
      }
    }
  };

  const handleSavePhone = async () => {
    setSaveLoading(true);
    setError('');
    try {
      const ref = doc(db, "users", auth.currentUser.uid);
      await updateDoc(ref, { phone: editPhone });
      setUserData({ ...userData, phone: editPhone });
      setEditMode(false);
    } catch (e) {
      setError('Ошибка при сохранении телефона');
    }
    setSaveLoading(false);
  };

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

  return (
    <div className="profile">
      <h1>Профиль</h1>
      {error && <p className="error">{error}</p>}
      <p>{userData?.name}</p>
      <p>Email: {userData?.email}</p>
      <p>
        Телефон:{" "}
        {editMode ? (
          <>
            <input
              type="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder="Телефон"
              style={{ marginRight: 8 }}
            />
            <button className="savephone-btn" onClick={handleSavePhone} disabled={saveLoading}>
              Сохранить
            </button>
            <button className="cancellSave" onClick={() => setEditMode(false)} disabled={saveLoading}>
              Отмена
            </button>
          </>
        ) : (
          <>
            {userData?.phone || "Не указан"}
            <button className="auth-btn" style={{ marginLeft: 10 }} onClick={() => setEditMode(true)}>
              Редактировать
            </button>
          </>
        )}
      </p>
      <button onClick={handleLogoutClick} className="auth-btn logout-btn">
        Выйти
      </button>

      {showLogoutDialog && (
         <div className="dialog-overlay">
            <div className="dialog">
              <p>Выйти?</p>
              <button onClick={() => setShowLogoutDialog(false)}  className="auth-btn-green delete-btn">Отмена</button>
              <button onClick={confirmLogout} className="auth-btn-yellow delete-btn">Выйти</button>
              <button onClick={confirmDeleteAccount} className="auth-btn delete-btn delete-btn">Удалить аккаунт и 
                все данные о пользователе</button>
            </div>
          </div>
      )}
    </div>
  );
}

export default Profile;