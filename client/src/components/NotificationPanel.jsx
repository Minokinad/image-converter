import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { socketUrl } from '../api.js';
import { statuses } from '../data/images.js';

const taskActions = { created: 'Создана', updated: 'Обновлена', deleted: 'Удалена' };
const presenceMessages = {
  joined: 'Участник открыл список задач.',
  disconnected: 'Участник отключился.',
};

export default function NotificationPanel({ token, onUnauthorized, onQueueChange }) {
  const [count, setCount] = useState(null);
  const [transport, setTransport] = useState('');
  const [status, setStatus] = useState('Подключение…');
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const entryId = useRef(0);

  useEffect(() => {
    const socket = io(socketUrl, { auth: { token }, autoConnect: false });
    let active = true;

    function append(message, at) {
      const entry = { id: ++entryId.current, message, at };
      setEntries((previous) => [entry, ...previous].slice(0, 20));
    }

    socket.on('connect', () => {
      setError('');
      const engine = socket.io.engine;
      setTransport(engine.transport.name);
      engine.once('upgrade', (upgraded) => setTransport(upgraded.name));
      socket.timeout(4000).emit('queue:watch', (failure, result) => {
        if (!active || !socket.connected) return;
        if (failure) {
          socket.disconnect();
          setError('Сервер не подтвердил подписку.');
          return;
        }
        setCount(result.count);
        setStatus('Подключено');
        onQueueChange();
      });
    });
    socket.on('connect_error', (failure) => {
      if (failure.data?.code === 'UNAUTHORIZED') onUnauthorized();
      else setStatus('Ожидание соединения…');
    });
    socket.on('disconnect', (reason) => {
      if (!active) return;
      if (reason === 'io server disconnect') {
        onUnauthorized();
        return;
      }
      setCount(null);
      setTransport('');
      setStatus(socket.active ? 'Переподключение…' : 'Отключено');
    });
    socket.on('queue:presence', ({ action, count, at }) => {
      setCount(count);
      append(presenceMessages[action], at);
    });
    socket.on('task:changed', ({ action, filename, format, status, at }) => {
      const name = `«${filename}» · ${format.toUpperCase()}`;
      append(`${taskActions[action]} задача ${name} · ${statuses[status] ?? status}`, at);
      onQueueChange();
    });

    socket.connect();
    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, onUnauthorized, onQueueChange, attempt]);

  return <section className="panel notifications" aria-labelledby="notification-title">
    <h2 id="notification-title">Уведомления о задачах</h2>
    <p className="notification-status" role="status">
      {status}{transport === 'websocket' && count !== null ? ' · WebSocket' : ''}
      {count !== null ? ` · Подключений: ${count}` : ''}
    </p>
    {error && <p className="error" role="alert">{error}{' '}
      <button onClick={() => { setError(''); setStatus('Подключение…'); setAttempt((value) => value + 1); }}>Подключиться снова</button>
    </p>}
    <div className="notification-log" aria-live="polite" aria-label="События задач">
      {entries.length === 0 ? <p>Новых событий пока нет.</p> : <ul>
        {entries.map(({ id, message, at }) => <li key={id}>
          <time dateTime={at}>{new Date(at).toLocaleTimeString('ru-RU')}</time>
          <span>{message}</span>
        </li>)}
      </ul>}
    </div>
  </section>;
}
