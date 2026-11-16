import { useEffect, useState } from 'react';
import { createPreset, deletePreset, fetchPresets, replacePreset } from '../api.js';

export default function usePresets(onUnauthorized) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchPresets(controller.signal).then((data) => {
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

  async function mutate(send, apply, message) {
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await send();
      setItems((previous) => apply(previous, result));
      setNotice(message);
      return true;
    } catch (failure) {
      if (failure.status === 401) onUnauthorized();
      else setError(failure.message);
      return false;
    } finally {
      setPending(false);
    }
  }

  function save(preset, id) {
    return id
      ? mutate(() => replacePreset(id, preset), (previous, saved) =>
        previous.map((item) => item._id === id ? saved : item), 'Пресет обновлён.')
      : mutate(() => createPreset(preset), (previous, saved) =>
        [saved, ...previous], 'Пресет создан.');
  }

  function remove(id) {
    return mutate(() => deletePreset(id), (previous) =>
      previous.filter((item) => item._id !== id), 'Пресет удалён.');
  }

  function retry() {
    setError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return { items, loading, loaded, pending, error, notice, save, remove, retry };
}
