import { useState } from 'react';
import { login, register } from '../api.js';

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'register') {
        await register(credentials);
        setMode('login');
        setNotice('Аккаунт создан. Войдите с указанными данными.');
      } else {
        const result = await login(credentials);
        localStorage.setItem('token', result.token);
        onLogin(result.token);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return <section className="panel auth-panel">
    <h2>{mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
    <p className="muted">Войдите, чтобы управлять задачами конвертации на сервере.</p>
    <form onSubmit={submit}>
      <fieldset disabled={pending}>
        <label>Email<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Пароль<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 6 : 1} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary" type="submit">{pending ? 'Отправка…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'Зарегистрироваться' : 'Уже есть аккаунт'}</button>
      </fieldset>
    </form>
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
