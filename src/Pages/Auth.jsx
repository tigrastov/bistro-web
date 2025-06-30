
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';

import './Auth.css';

// Функция перевода ошибок Firebase
const translateFirebaseError = (error) => {
  const errorMap = {
    'auth/invalid-email': 'Некорректный email',
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/email-already-in-use': 'Этот email уже зарегистрирован',
    'auth/weak-password': 'Пароль должен быть не менее 6 символов',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
    'auth/network-request-failed': 'Ошибка сети. Проверьте интернет-соединение'
  };
  return errorMap[error.code] || 'Произошла неизвестная ошибка';
};

function Auth() {
   const navigate = useNavigate();
   const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [resetMode, setResetMode] = useState(false);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setIsAuth(!!user);
    setAuthLoading(false);
    if (user) {
      navigate('/profile');
    }
  });
  return unsubscribe;
}, [navigate]);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    await signOut(auth);
    setIsAuth(false);
    setEmail('');
    setPassword('');
    setShowLogoutDialog(false);
  };

  const confirmDeleteAccount = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await deleteDoc(doc(db, "users", user.uid)); // Firestore
      await deleteUser(user); // Auth
    }
    setIsAuth(false);
    setEmail('');
    setPassword('');
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      setError('Для удаления аккаунта нужно заново войти. Пожалуйста, выйдите и войдите снова.');
    } else {
      setError('Ошибка при удалении аккаунта: ' + (err.message || ''));
    }
  }
  setShowLogoutDialog(false);
  navigate('/auth'); 
};

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        // Сохраняем пользователя в Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name,
          phone,
          createdAt: new Date()
        });
      }
      setIsAuth(true);
      navigate('/profile'); 
    } catch (err) {
      setError(translateFirebaseError(err));
      console.error('Ошибка Firestore:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Введите email для восстановления');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Письмо для сброса пароля отправлено на ${email}`);
    } catch (err) {
      setError(translateFirebaseError(err));
      console.log('Firebase error code:', err.code); 
    }
  };

  if (authLoading) {
   return <div className="auth"><p>Загрузка...</p></div>;
  }


  if (resetMode) {
  return (
    <div className="auth">
      <h1>Восстановление пароля</h1>
      {error && <p className="error">{error}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) {
            setError('Введите email для восстановления');
            return;
          }
          try {
            await sendPasswordResetEmail(auth, email);
            alert(`Письмо для сброса пароля отправлено на ${email}`);
            setResetMode(false);
            setError('');
          } catch (err) {
            setError(translateFirebaseError(err));
          }
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <button type="submit" className="auth-btn">
          Отправить письмо
        </button>
      </form>
      <button
        className="auth-link"
        onClick={() => {
          setResetMode(false);
          setError('');
        }}
      >
        Назад к авторизации
      </button>
    </div>
  );
}



  if (isAuth) {
    return (
      <div className="auth is-authenticated">

        <h1> Мы всегда вам рады!</h1>
        {/* <p>Email: {auth.currentUser?.email}</p>
        <p>Имя: {auth.currentUser?.displayName || 'Не указано'}</p> */}
        {/* <p>Телефон: {localStorage.getItem('user_phone') || 'Не указан'}</p> */}
        
        <button 
          onClick={handleLogout}
          className="auth-btn logout-btn"
        >
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

  return (
    <div className="auth">
      <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleAuth}>
        {!isLogin && (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон (+79991234567)"
              required={!isLogin}
            />
          </>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          required
        />
        <button type="submit" className="auth-btn">
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="auth-links">
        {isLogin && (
          <button
  onClick={() => setResetMode(true)}
  className="auth-link"
>
  Забыли пароль?
</button>
        )}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="auth-link"
        >
          {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}



export default Auth;