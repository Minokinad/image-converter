import { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { filters, formats, statuses } from '../data/images.js';
import ImageForm from './ImageForm.jsx';

export default function ImageList() {
  const { items, setItems, loaded, error, warning, saveStatus } = useLocalStorage();
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [format, setFormat] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const previousTitle = document.title;
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    document.title = loaded ? `Задач: ${items.length} · Конвертер изображений` : 'Загрузка · Конвертер изображений';
  }, [items.length, loaded]);

  const completed = items.filter((item) => item.status === 'completed').length;
  const totalSize = items.reduce((sum, item) => sum + item.fileSize, 0);
  const visible = items.filter((item) =>
    item.filename.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')) &&
    (status === 'all' || item.status === status) && (format === 'all' || item.targetFormat === format),
  );
  if (sort === 'name') visible.sort((a, b) => a.filename.localeCompare(b.filename, 'ru'));
  if (sort === 'size') visible.sort((a, b) => b.fileSize - a.fileSize);
  const editingImage = items.find((item) => item.id === editingId);

  function saveImage(values) {
    if (editingId) {
      setItems((previous) => previous.map((item) => item.id === editingId ? { ...values, id: editingId } : item));
      setEditingId(null);
    } else {
      setItems((previous) => [{ ...values, id: crypto.randomUUID() }, ...previous]);
    }
  }

  function removeImage(id) {
    setItems((previous) => previous.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <main className="workspace">
      <header className="page-header">
        <div><p className="eyebrow">IMAGE CONVERTER / ЛОКАЛЬНАЯ БИБЛИОТЕКА</p><h1>Задачи конвертации<span>.</span></h1><p className="intro">Управляйте параметрами изображений в одном месте.</p></div>
        <div className="save-state" role="status"><span className={error ? 'dot failed' : 'dot'} />{saveStatus}</div>
      </header>
      <p className="local-note">Автономный режим · Данные хранятся в этом браузере. Конвертация файлов не выполняется.</p>
      {warning && <p className="notice" role="alert">{warning}</p>}
      {error && <p className="error notice" role="alert">{error}</p>}
      {!loaded ? <section className="panel loading" aria-busy="true">Загрузка задач…</section> : <>
        <section className="stats" aria-label="Статистика">
          {[['Всего задач', items.length], ['Выполнено', completed], ['В очереди', items.length - completed], ['Общий размер, КБ', totalSize.toLocaleString('ru-RU')]].map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </section>
        <div className="content-grid">
          <ImageForm key={editingId ?? 'new'} image={editingImage} onSave={saveImage} onCancel={() => setEditingId(null)} />
          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="section-heading"><span className="step">02</span><h2 id="list-title">Список задач</h2><span className="count">{visible.length} из {items.length}</span></div>
            <div className="toolbar">
              <label className="search-field">Поиск по имени<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти изображение…" /></label>
              <label>Статус задач<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Все статусы</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Формат результата<select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">Все форматы</option>{formats.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>
              <label>Сортировка<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="name">По имени</option><option value="size">По размеру ↓</option></select></label>
            </div>
            <div className="task-list">
              {visible.map((item) => <article className="task" key={item.id} aria-label={`Задача ${item.filename}`}>
                <div className="file-icon" aria-hidden="true">{item.targetFormat.toUpperCase()}</div>
                <div className="task-info"><h3>{item.filename}</h3><p className="task-meta">{item.originalFormat.toUpperCase()} → {item.targetFormat.toUpperCase()} · {item.width ?? 'авто'} × {item.height ?? 'авто'} px</p><p className="task-meta">{filters[item.filter]} · {item.fileSize.toLocaleString('ru-RU')} КБ</p></div>
                <span className={`badge ${item.status}`}>{statuses[item.status]}</span>
                <div className="task-actions"><button onClick={() => setEditingId(item.id)} aria-label={`Редактировать ${item.filename}`}>Изменить</button><button className="danger" onClick={() => removeImage(item.id)} aria-label={`Удалить ${item.filename}`}>Удалить</button></div>
              </article>)}
              {visible.length === 0 && <div className="empty"><h3>{items.length === 0 ? 'Задач пока нет' : 'Ничего не найдено'}</h3><p>{items.length === 0 ? 'Добавьте первую задачу с помощью формы.' : 'Попробуйте другое имя или измените фильтры.'}</p></div>}
            </div>
          </section>
        </div>
      </>}
      <footer>Лабораторная работа № 4 <span>React · useState · useEffect</span></footer>
    </main>
  );
}
