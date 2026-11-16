import { useCallback, useEffect, useState } from 'react';
import { fetchProfile } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import ImageList from './components/ImageList.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const expire = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError('Сессия истекла. Войдите снова.');
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setError('');
    fetchProfile(controller.signal).then((profile) => {
      if (!controller.signal.aborted) setUser(profile);
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) expire();
      else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, attempt, expire]);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setError('');
  }

  if (token && user) return <ImageList key={token} user={user} token={token} onLogout={logout} onUnauthorized={expire} />;

  return <main className="workspace">
    <header className="page-header"><div><p className="eyebrow">IMAGE CONVERTER</p><h1>Задачи конвертации<span>.</span></h1></div></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    {token ? <section className="panel loading" aria-busy={!error}>
      {error ? <><button onClick={() => setAttempt((value) => value + 1)}>Повторить</button> <button onClick={logout}>Выйти</button></> : <><span className="spinner" />Проверка сессии…</>}
    </section> : <AuthForm onLogin={(value) => { setError(''); setToken(value); }} />}
  </main>;
}
