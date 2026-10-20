import { useEffect, useState } from 'react';
import { initialImages, isImageList, STORAGE_KEY } from '../data/images.js';

export default function useLocalStorage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [savedItems, setSavedItems] = useState(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      let nextItems = initialImages;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (!isImageList(parsed)) throw new Error('Invalid data');
          nextItems = parsed;
        }
      } catch {
        setWarning('Не удалось прочитать сохранённые задачи. Загружены примеры.');
      }
      setItems(nextItems);
      setLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        setSavedItems(items);
        setError('');
      } catch {
        setError('Не удалось сохранить задачи. Проверьте доступ к хранилищу браузера и свободное место.');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [items, loaded]);

  const saveStatus = !loaded ? 'Загрузка…' : error ? 'Ошибка сохранения' : items === savedItems ? 'Все изменения сохранены' : 'Ожидается сохранение…';
  return { items, setItems, loaded, error, warning, saveStatus };
}
