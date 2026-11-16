import { useEffect, useState } from 'react';
import useImages from '../hooks/useImages.js';
import usePresets from '../hooks/usePresets.js';
import { filters, formats, statuses } from '../data/images.js';
import ImageForm from './ImageForm.jsx';
import PresetPanel from './PresetPanel.jsx';

export default function ImageList({ user, onLogout, onUnauthorized }) {
  const { items, loading, loaded, error, notice, pending, save, remove, retry } = useImages(onUnauthorized);
  const presets = usePresets(onUnauthorized);
  const saveStatus = pending ? 'Сохранение на сервере…' : loading ? 'Загрузка…' : error ? 'Ошибка запроса' : 'Данные синхронизированы';
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
  if (sort === 'newest') visible.sort((a, b) => String(b.id).startsWith('temporary-') - String(a.id).startsWith('temporary-') || Number(b.id) - Number(a.id));
  if (sort === 'name') visible.sort((a, b) => a.filename.localeCompare(b.filename, 'ru'));
  if (sort === 'size') visible.sort((a, b) => b.fileSize - a.fileSize);
  const editingImage = items.find((item) => item.id === editingId);

  async function saveImage(values) {
    const saved = await save(values, editingImage);
    if (saved) setEditingId(null);
    return saved;
  }

  async function removeImage(item) {
    const removed = await remove(item);
    if (removed && editingId === item.id) setEditingId(null);
  }

  return (
    <main className="workspace">
      <header className="page-header">
        <div><p className="eyebrow">IMAGE CONVERTER / БИБЛИОТЕКА ИЗОБРАЖЕНИЙ</p><h1>Задачи конвертации<span>.</span></h1><p className="intro">Управляйте параметрами изображений в одном месте.</p></div>
        <div className="account"><span>{user.email}</span><button onClick={onLogout} disabled={pending}>Выйти</button><div className="save-state" role="status"><span className={error ? 'dot failed' : 'dot'} />{saveStatus}</div></div>
      </header>
      <p className="local-note">Задачи хранятся на сервере. Здесь вы управляете параметрами; конвертация файлов не выполняется.</p>
      {notice && <p className="notice success" role="status">{notice}</p>}
      {error && <p className="error notice" role="alert">{error} {!loaded && <button onClick={retry} disabled={loading}>Повторить</button>}</p>}
      {loading ? <section className="panel loading" role="status" aria-busy="true"><span className="spinner" />Загрузка задач…</section> : loaded ? <>
        <section className="stats" aria-label="Статистика">
          {[['Всего задач', items.length], ['Выполнено', completed], ['В очереди', items.length - completed], ['Общий размер, КБ', totalSize.toLocaleString('ru-RU')]].map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </section>
        <div className="content-grid">
          <ImageForm key={editingId ?? 'new'} image={editingImage} presets={presets.items}
            onSave={saveImage} onCancel={() => setEditingId(null)} pending={pending} />
          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="section-heading"><span className="step">02</span><h2 id="list-title">Список задач</h2><span className="count">{visible.length} из {items.length}</span></div>
            <div className="toolbar">
              <label className="search-field">Поиск по имени<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти изображение…" /></label>
              <label>Статус задач<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Все статусы</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Формат результата<select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">Все форматы</option>{formats.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>
              <label>Сортировка<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="name">По имени</option><option value="size">По размеру ↓</option></select></label>
            </div>
            <div className="task-list">
              {visible.map((item) => <article className="task" aria-busy={pending} key={item.id} aria-label={`Задача ${item.filename}`}>
                <div className="file-icon" aria-hidden="true">{item.targetFormat.toUpperCase()}</div>
                <div className="task-info"><h3>{item.filename}</h3><p className="task-meta">{item.originalFormat.toUpperCase()} → {item.targetFormat.toUpperCase()} · {item.width ?? 'авто'} × {item.height ?? 'авто'} px</p><p className="task-meta">{filters[item.filter]} · {item.fileSize.toLocaleString('ru-RU')} КБ</p></div>
                <span className={`badge ${item.status}`}>{statuses[item.status]}</span>
                <div className="task-actions"><button disabled={pending} onClick={() => setEditingId(item.id)} aria-label={`Редактировать ${item.filename}`}>Изменить</button><button disabled={pending} className="danger" onClick={() => removeImage(item)} aria-label={`Удалить ${item.filename}`}>Удалить</button></div>
              </article>)}
              {visible.length === 0 && <div className="empty"><h3>{items.length === 0 ? 'Задач пока нет' : 'Ничего не найдено'}</h3><p>{items.length === 0 ? 'Добавьте первую задачу с помощью формы.' : 'Попробуйте другое имя или измените фильтры.'}</p></div>}
            </div>
          </section>
        </div>
      </> : null}
      <PresetPanel presets={presets} />
      <footer>Лабораторная работа № 6 <span>React · PostgreSQL · MongoDB</span></footer>
    </main>
  );
}
