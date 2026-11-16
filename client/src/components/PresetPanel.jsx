import { useState } from 'react';
import { filters, formats } from '../data/images.js';

function newOutput(targetFormat) {
  return { targetFormat, width: '', height: '', filter: 'none' };
}

function PresetForm({ preset, pending, onSave, onCancel }) {
  const [name, setName] = useState(preset?.name ?? '');
  const [outputs, setOutputs] = useState(() => preset
    ? preset.outputs.map((output) => ({ ...output, width: output.width ?? '', height: output.height ?? '' }))
    : []);
  const availableFormats = formats.filter((format) => !outputs.some((output) => output.targetFormat === format));

  function updateOutput(format, field, value) {
    setOutputs((previous) => previous.map((output) =>
      output.targetFormat === format ? { ...output, [field]: value } : output));
  }

  function submit(event) {
    event.preventDefault();
    if (!name.trim() || !outputs.length) return;
    onSave({
      name: name.trim(),
      outputs: outputs.map((output) => ({
        ...output,
        width: output.width === '' ? null : Number(output.width),
        height: output.height === '' ? null : Number(output.height),
      })),
    });
  }

  return (
    <form className="preset-form" onSubmit={submit}>
      <fieldset disabled={pending}>
        <h3>{preset ? 'Редактирование пресета' : 'Новый пресет'}</h3>
        <label>Название пресета
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder="Например, Для сайта" />
        </label>
        {outputs.map(({ targetFormat, width, height, filter }) => {
          const label = targetFormat.toUpperCase();
          return (
            <fieldset className="preset-output" key={targetFormat}>
              <legend>{label}</legend>
              <div className="field-pair">
                <label>Ширина {label}, px
                  <input type="number" min="1" max="10000" placeholder="Оригинал" value={width}
                    onChange={(event) => updateOutput(targetFormat, 'width', event.target.value)} />
                </label>
                <label>Высота {label}, px
                  <input type="number" min="1" max="10000" placeholder="Оригинал" value={height}
                    onChange={(event) => updateOutput(targetFormat, 'height', event.target.value)} />
                </label>
              </div>
              <label>Фильтр {label}
                <select value={filter} onChange={(event) => updateOutput(targetFormat, 'filter', event.target.value)}>
                  {Object.entries(filters).map(([value, text]) => <option value={value} key={value}>{text}</option>)}
                </select>
              </label>
              {outputs.length > 1 && <div>
                <button type="button" className="danger" onClick={() => setOutputs((previous) =>
                  previous.filter((output) => output.targetFormat !== targetFormat))}>Убрать {label}</button>
              </div>}
            </fieldset>
          );
        })}
        {availableFormats.length > 0 && (
          <label>Добавить выходной формат
            <select value="" onChange={(event) => setOutputs((previous) => [...previous, newOutput(event.target.value)])}>
              <option value="" disabled>Выбрать формат</option>
              {availableFormats.map((format) => <option value={format} key={format}>{format.toUpperCase()}</option>)}
            </select>
          </label>
        )}
        <div className="form-actions">
          <button className="primary" type="submit" disabled={!name.trim() || !outputs.length}>
            {pending ? 'Сохранение…' : 'Сохранить пресет'}
          </button>
          <button type="button" onClick={onCancel}>Отмена</button>
        </div>
      </fieldset>
    </form>
  );
}

export default function PresetPanel({ presets }) {
  const { items, loading, loaded, pending, error, notice, save, remove, retry } = presets;
  const [editor, setEditor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function savePreset(values) {
    if (await save(values, editor._id)) setEditor(null);
  }

  async function deleteSelected(id) {
    if (await remove(id)) setDeletingId(null);
  }

  return (
    <section id="presets" className="panel presets-panel" aria-labelledby="presets-title" aria-busy={loading || pending}>
      <div className="section-heading">
        <h2 id="presets-title">Пресеты конвертации</h2>
        {loaded && editor === null && !deletingId && <button type="button" className="presets-add"
          disabled={pending} onClick={() => setEditor({})}>Новый пресет</button>}
      </div>
      {loading && <p className="muted" role="status">Загрузка пресетов…</p>}
      {error && <p className="notice error" role="alert">{error}{!loaded && <> <button type="button" onClick={retry}>Повторить</button></>}</p>}
      {notice && !editor && <p className="notice success" role="status">{notice}</p>}
      {loaded && (
        <div className={editor && items.length ? 'preset-layout editing' : 'preset-layout'}>
          <div className="preset-list">
            {!items.length && !editor && <p className="muted">Создайте пресет, чтобы сохранить параметры для повторного использования.</p>}
            {items.map((preset) => (
              <article className="preset-card" key={preset._id}>
                <h3>{preset.name}</h3>
                <ul>
                  {preset.outputs.map(({ targetFormat, width, height, filter }) => (
                    <li key={targetFormat}>
                      <strong>{targetFormat.toUpperCase()}</strong>
                      <span>{width ?? 'авто'} × {height ?? 'авто'} px</span>
                      <span>{filters[filter]}</span>
                    </li>
                  ))}
                </ul>
                <div className="form-actions">
                  {deletingId === preset._id ? <>
                    <button type="button" className="danger" disabled={pending} onClick={() => deleteSelected(preset._id)}>Подтвердить удаление</button>
                    <button type="button" disabled={pending} onClick={() => setDeletingId(null)}>Отмена</button>
                  </> : <>
                    <button type="button" disabled={pending || !!editor || !!deletingId}
                      aria-label={`Редактировать пресет «${preset.name}»`} onClick={() => setEditor(preset)}>Изменить</button>
                    <button type="button" className="danger" disabled={pending || !!editor || !!deletingId}
                      aria-label={`Удалить пресет «${preset.name}»`} onClick={() => setDeletingId(preset._id)}>Удалить</button>
                  </>}
                </div>
              </article>
            ))}
          </div>
          {editor && <PresetForm key={editor._id ?? 'new'} preset={editor._id ? editor : null}
            pending={pending} onSave={savePreset} onCancel={() => setEditor(null)} />}
        </div>
      )}
    </section>
  );
}
