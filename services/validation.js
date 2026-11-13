const rules = require('../config/validationRules.json');

const fields = ['filename', 'originalFormat', 'targetFormat', 'width', 'height', 'filter', 'status'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function formValues(body) {
  return Object.fromEntries(fields.map(key => {
    const value = isRecord(body) ? body[key] : undefined;
    return [key, typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 255) : ''];
  }));
}

function validateImageInput(body) {
  if (!isRecord(body)) {
    return { errors: ['Ожидается объект с полями задания.'], values: {}, data: null };
  }
  const errors = [];
  const values = formValues(body);
  const data = {};
  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  if (filename.length < rules.filename.minLength || filename.length > rules.filename.maxLength) {
    errors.push('Имя файла должно содержать от 3 до 255 символов.');
  } else if (/[\u0000-\u001f\u007f/\\]/.test(filename)) {
    errors.push('Имя файла не должно содержать управляющие символы и разделители пути.');
  }
  data.filename = filename;
  for (const [key, allowed, fallback, label] of [
    ['originalFormat', rules.allowedOriginalFormats, null, 'Исходный формат'],
    ['targetFormat', rules.allowedTargetFormats, null, 'Целевой формат'],
    ['filter', rules.allowedFilters, 'none', 'Фильтр'],
    ['status', rules.allowedStatuses, 'pending', 'Статус']
  ]) {
    const raw = body[key];
    const value = raw === undefined || raw === '' ? fallback : typeof raw === 'string' ? raw.trim().toLowerCase() : null;
    if (!allowed.includes(value)) errors.push(`${label}: выберите допустимое значение.`);
    data[key] = value;
  }
  for (const [key, label] of [['width', 'Ширина'], ['height', 'Высота']]) {
    const raw = body[key];
    const validType = typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim()));
    const value = validType ? Number(raw) : NaN;
    if (!Number.isInteger(value) || value < 0 || value > 10000) {
      errors.push(`${label} должна быть целым числом от 0 до 10000.`);
    }
    data[key] = value;
  }
  return { errors, values, data };
}

function parseId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

module.exports = { rules, validateImageInput, formValues, parseId, isRecord };
