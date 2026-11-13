const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const AppError = require('./errors');
const { validateImageInput, isRecord } = require('./validation');

function createImageStore(file) {
  let queue = Promise.resolve();

  async function fileInfo() {
    const info = await fs.stat(file);
    if (!info.isFile()) {
      throw new AppError(500, 'STORAGE_NOT_FILE', 'По пути файла данных находится каталог или другой объект. Чтение и запись заблокированы. Восстановите файл данных.');
    }
    return info;
  }

  async function read() {
    try {
      const info = await fileInfo();
      if (info.size > 5 * 1024 * 1024) throw new Error('Invalid storage file');
      const rows = JSON.parse(await fs.readFile(file, 'utf8'));
      const ids = new Set();
      if (!Array.isArray(rows)) throw new Error('Expected an array');
      for (const row of rows) {
        if (!isRecord(row) || !Number.isSafeInteger(row.id) || row.id < 1 || ids.has(row.id) ||
            validateImageInput(row).errors.length ||
            !['createdAt', 'updatedAt'].every(key => typeof row[key] === 'string' && Number.isFinite(Date.parse(row[key])))) {
          throw new Error('Invalid image record');
        }
        ids.add(row.id);
      }
      return rows;
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      throw new AppError(500, 'STORAGE_READ_FAILED', 'Не удалось прочитать хранилище заданий. Проверьте файл данных. Данные не изменены.', cause);
    }
  }

  async function write(rows) {
    const document = JSON.stringify(rows, null, 2) + '\n';
    if (Buffer.byteLength(document, 'utf8') > 5 * 1024 * 1024) {
      throw new AppError(413, 'STORAGE_LIMIT', 'Хранилище достигло ограничения 5 Мбайт. Предыдущие записи сохранены.');
    }
    const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
    try {
      await fileInfo();
      const handle = await fs.open(temporary, 'wx', 0o600);
      try {
        await handle.writeFile(document, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(temporary, file);
    } catch (cause) {
      await fs.unlink(temporary).catch(() => {});
      if (cause instanceof AppError) throw cause;
      throw new AppError(500, 'STORAGE_WRITE_FAILED', 'Не удалось сохранить задание. Проверьте права записи. Предыдущие данные сохранены.', cause);
    }
  }

  function change(transform) {
    const operation = queue.then(async () => {
      const rows = await read();
      const value = transform(rows);
      await write(rows);
      return value;
    });
    queue = operation.catch(() => {});
    return operation;
  }

  return {
    read,
    create: data => change(rows => {
      const id = Math.max(0, ...rows.map(row => row.id)) + 1;
      if (!Number.isSafeInteger(id)) throw new AppError(500, 'ID_EXHAUSTED', 'Невозможно назначить идентификатор задания.');
      const now = new Date().toISOString();
      const row = { id, ...data, createdAt: now, updatedAt: now };
      rows.push(row);
      return row;
    }),
    update: (id, data) => change(rows => {
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
      rows[index] = { ...rows[index], ...data, updatedAt: new Date().toISOString() };
      return rows[index];
    }),
    remove: id => change(rows => {
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
      return rows.splice(index, 1)[0];
    })
  };
}

module.exports = createImageStore;
