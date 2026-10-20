import { useState } from 'react';
import { filters, formats, statuses } from '../data/images.js';

const emptyForm = { filename: '', originalFormat: 'png', targetFormat: 'webp', width: '', height: '', filter: 'none', status: 'pending', fileSize: '0' };

export default function ImageForm({ image, onSave, onCancel }) {
  const [form, setForm] = useState(image ? { ...image, width: image.width ?? '', height: image.height ?? '' } : emptyForm);
  const [error, setError] = useState('');

  function update(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    if (!form.filename.trim()) {
      setError('Введите имя файла, содержащее хотя бы один непробельный символ.');
      return;
    }
    onSave({
      ...form,
      filename: form.filename.trim(),
      width: form.width === '' ? null : Number(form.width),
      height: form.height === '' ? null : Number(form.height),
      fileSize: Number(form.fileSize),
    });
    if (!image) setForm(emptyForm);
    setError('');
  }

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="section-heading"><span className="step">01</span><h2 id="form-title">{image ? 'Редактировать задачу' : 'Новая задача'}</h2></div>
      <p className="muted">Задайте параметры изображения для конвертации.</p>
      <form onSubmit={submit}>
        <label>Имя файла<input name="filename" value={form.filename} onChange={update} required maxLength={255} placeholder="Например, photo.png" /></label>
        <div className="field-pair">
          <label>Исходный формат<select name="originalFormat" value={form.originalFormat} onChange={update}>{formats.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}</select></label>
          <label>Целевой формат<select name="targetFormat" value={form.targetFormat} onChange={update}>{formats.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}</select></label>
        </div>
        <div className="field-pair">
          <label>Ширина, px<input type="number" name="width" value={form.width} onChange={update} min="1" max="10000" step="1" placeholder="Оригинал" /></label>
          <label>Высота, px<input type="number" name="height" value={form.height} onChange={update} min="1" max="10000" step="1" placeholder="Оригинал" /></label>
        </div>
        <label>Фильтр<select name="filter" value={form.filter} onChange={update}>{Object.entries(filters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="field-pair">
          <label>Статус<select name="status" value={form.status} onChange={update}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Размер, КБ<input type="number" name="fileSize" value={form.fileSize} onChange={update} min="0" step="1" required /></label>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="form-actions"><button type="submit" className="primary">{image ? 'Сохранить изменения' : 'Добавить задачу'}</button>{image && <button type="button" onClick={onCancel}>Отмена</button>}</div>
      </form>
    </section>
  );
}
