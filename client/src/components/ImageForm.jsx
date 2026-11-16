import { useState } from 'react';
import { filters, formats, statuses } from '../data/images.js';

const emptyForm = { filename: '', originalFormat: 'png', targetFormat: 'webp', width: '', height: '', filter: 'none', status: 'pending', fileSize: '0' };

export default function ImageForm({ image, presets, onSave, onCancel, pending }) {
  const [form, setForm] = useState(image ? { ...image, width: image.width ?? '', height: image.height ?? '' } : emptyForm);
  const [error, setError] = useState('');

  function update(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  }

  function applyPreset(event) {
    const [id, format] = event.target.value.split('/');
    const output = presets.find((preset) => preset._id === id)?.outputs
      .find((item) => item.targetFormat === format);
    if (!output) return;
    const { targetFormat, width, height, filter } = output;
    setForm((previous) => ({
      ...previous, targetFormat, width: width ?? '', height: height ?? '', filter,
    }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.filename.trim()) {
      setError('Введите имя файла, содержащее хотя бы один непробельный символ.');
      return;
    }
    const saved = await onSave({
      ...form,
      filename: form.filename.trim(),
      width: form.width === '' ? null : Number(form.width),
      height: form.height === '' ? null : Number(form.height),
      fileSize: Number(form.fileSize),
    });
    if (saved && !image) setForm(emptyForm);
    setError('');
  }

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="section-heading"><span className="step">01</span><h2 id="form-title">{image ? 'Редактировать задачу' : 'Новая задача'}</h2></div>
      <p className="muted">Задайте параметры изображения для конвертации.</p>
      <form onSubmit={submit}>
        <fieldset disabled={pending}>
          <label>Имя файла<input name="filename" value={form.filename} onChange={update} required maxLength={255} placeholder="Например, photo.png" /></label>
          <div className="preset-picker">
            {presets.length > 0 && <label>Применить пресет
              <select value="" onChange={applyPreset}>
                <option value="" disabled>Выбрать пресет и формат</option>
                {presets.map(({ _id, name, outputs }) => (
                  <optgroup key={_id} label={name}>
                    {outputs.map(({ targetFormat }) => (
                      <option key={targetFormat} value={`${_id}/${targetFormat}`}>
                        {name} · {targetFormat.toUpperCase()}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>}
            <a href="#presets">Управление пресетами</a>
          </div>
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
            <label>Статус<select disabled={!image} name="status" value={form.status} onChange={update}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Размер, КБ<input type="number" name="fileSize" value={form.fileSize} onChange={update} min="0" step="1" required /></label>
          </div>
          {error && <p role="alert" className="error">{error}</p>}
          <div className="form-actions"><button type="submit" className="primary">{pending ? 'Сохранение…' : image ? 'Сохранить изменения' : 'Добавить задачу'}</button>{image && <button type="button" onClick={onCancel}>Отмена</button>}</div>
        </fieldset>
      </form>
    </section>
  );
}
