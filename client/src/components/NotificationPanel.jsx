import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { socketUrl } from '../api.js';
import { formats, statuses } from '../data/images.js';

const taskActions = { created: 'Создана', updated: 'Обновлена', deleted: 'Удалена' };
const presenceMessages = {
  joined: 'Участник подключился к комнате.',
  switched: 'Участник перешёл в другую комнату.',
  disconnected: 'Участник отключился.',
};

export default function NotificationPanel({ token, onUnauthorized }) {
  const [format, setFormat] = useState('all');
  const [count, setCount] = useState(null);
  const [transport, setTransport] = useState('');
  const [status, setStatus] = useState('Подключение…');
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const currentRoom = useRef('all');
  const subscribe = useRef(null);
  const entryId = useRef(0);

  useEffect(() => {
    const socket = io(socketUrl, { auth: { token }, autoConnect: false });
    let active = true;

    function append(message, at) {
      const entry = { id: ++entryId.current, message, at };
      setEntries((previous) => [entry, ...previous].slice(0, 20));
    }

    subscribe.current = (nextFormat) => {
      if (!socket.connected) return;
      setBusy(true);
      socket.timeout(4000).emit('room:join', nextFormat, (failure, result) => {
        if (!active || !socket.connected) return;
        if (failure || !result?.ok) {
          socket.disconnect();
          setError(result?.error || 'Сервер не подтвердил вход в комнату.');
          return;
        }
        if (currentRoom.current !== nextFormat) setEntries([]);
        currentRoom.current = nextFormat;
        setFormat(nextFormat);
        setCount(result.count);
        setStatus('Подключено');
        setBusy(false);
      });
    };

    socket.on('connect', () => {
      setError('');
      const engine = socket.io.engine;
      setTransport(engine.transport.name);
      engine.once('upgrade', (upgraded) => setTransport(upgraded.name));
      subscribe.current(currentRoom.current);
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
      setBusy(true);
      setCount(null);
      setTransport('');
      setStatus(socket.active ? 'Переподключение…' : 'Отключено');
    });
    socket.on('room:presence', ({ action, count, at }) => {
      setCount(count);
      append(presenceMessages[action], at);
    });
    socket.on('task:changed', (event) => {
      const changedFormat = event.previousFormat !== event.format;
      const target = changedFormat
        ? `${event.previousFormat.toUpperCase()} → ${event.format.toUpperCase()}`
        : event.format.toUpperCase();
      const status = statuses[event.status] ?? event.status;
      append(`${taskActions[event.action]} задача «${event.filename}» · ${target} · ${status}`, event.at);
    });

    socket.connect();
    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
      subscribe.current = null;
    };
  }, [token, onUnauthorized, attempt]);

  return <section className="panel notifications" aria-labelledby="notification-title">
    <div className="notification-header">
      <div>
        <h2 id="notification-title">Уведомления о задачах</h2>
        <p className="notification-status" role="status">
          {status}{transport === 'websocket' && count !== null ? ' · WebSocket' : ''}
          {count !== null ? ` · Участников: ${count}` : ''}
        </p>
      </div>
      <label>Комната
        <select value={format} disabled={busy} onChange={(event) => subscribe.current(event.target.value)}>
          <option value="all">Все форматы</option>
          {formats.map((value) => <option value={value} key={value}>{value.toUpperCase()}</option>)}
        </select>
      </label>
    </div>
    {error && <p className="error" role="alert">{error}{' '}
      <button onClick={() => { setError(''); setStatus('Подключение…'); setAttempt((value) => value + 1); }}>Подключиться снова</button>
    </p>}
    <div className="notification-log" aria-live="polite" aria-label="События комнаты">
      {entries.length === 0 ? <p>Новых событий пока нет.</p> : <ul>
        {entries.map(({ id, message, at }) => <li key={id}>
          <time dateTime={at}>{new Date(at).toLocaleTimeString('ru-RU')}</time>
          <span>{message}</span>
        </li>)}
      </ul>}
    </div>
  </section>;
}
