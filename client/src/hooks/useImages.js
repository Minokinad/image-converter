import { useEffect, useRef, useState } from 'react';
import { addItem, deleteItem, fetchItems, updateItem } from '../api.js';

export default function useImages(onUnauthorized) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const active = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchItems(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setItems(data);
      setLoaded(true);
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) onUnauthorized();
      else setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [attempt, onUnauthorized]);

  async function mutate(optimistic, send, commit, rollback, message) {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    setItems(optimistic);
    try {
      const saved = await send();
      if (!active.current) return false;
      setItems((previous) => commit(previous, saved));
      setNotice(message);
      return true;
    } catch (failure) {
      if (!active.current) return false;
      setItems(rollback);
      if (failure.status === 401) onUnauthorized();
      else setError(`${failure.message} Изменение отменено.`);
      return false;
    } finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  }

  function save(values, original) {
    const payload = Object.fromEntries(['filename', 'originalFormat', 'targetFormat', 'width', 'height', 'filter', 'status', 'fileSize'].map((key) => [key, values[key]]));
    if (original) {
      return mutate(
        (previous) => previous.map((item) => item.id === original.id ? { ...original, ...payload } : item),
        () => updateItem(original.id, payload),
        (previous, saved) => previous.map((item) => item.id === original.id ? saved : item),
        (previous) => previous.map((item) => item.id === original.id ? original : item),
        'Изменения сохранены на сервере.',
      );
    }
    const temporary = { ...payload, status: 'pending', id: `temporary-${crypto.randomUUID()}` };
    return mutate(
      (previous) => [temporary, ...previous],
      () => addItem(payload),
      (previous, saved) => previous.map((item) => item.id === temporary.id ? saved : item),
      (previous) => previous.filter((item) => item.id !== temporary.id),
      'Задача добавлена на сервер.',
    );
  }

  function remove(image) {
    const index = items.findIndex((item) => item.id === image.id);
    return mutate(
      (previous) => previous.filter((item) => item.id !== image.id),
      () => deleteItem(image.id),
      (previous) => previous,
      (previous) => [...previous.slice(0, index), image, ...previous.slice(index)],
      'Задача удалена с сервера.',
    );
  }

  return { items, loading, loaded, error, notice, pending, save, remove, retry: () => { if (!busy.current) setAttempt((value) => value + 1); } };
}
