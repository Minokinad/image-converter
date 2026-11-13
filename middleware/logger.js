const fs = require('node:fs/promises');
const path = require('node:path');

function createLogger(file, output = true) {
  let queue = Promise.resolve();
  function middleware(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000;
      const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration.toFixed(1)}ms | Request: ${req.requestId}\n`;
      if (output) console.log(line.trim());
      queue = queue.then(async () => {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.appendFile(file, line, 'utf8');
      }).catch(err => { console.error('Не удалось записать журнал:', err.message); });
    });
    next();
  }
  async function read() {
    await queue;
    try {
      const handle = await fs.open(file, 'r');
      try {
        const info = await handle.stat();
        if (!info.isFile()) throw new Error('По пути файла журнала находится каталог или другой объект.');
        const { size } = info;
        const length = Math.min(size, 128 * 1024);
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await handle.read(buffer, 0, length, size - length);
        return buffer.subarray(0, bytesRead).toString('utf8');
      } finally { await handle.close(); }
    } catch (err) {
      if (err.code === 'ENOENT') return 'Записей пока нет.';
      console.error('Не удалось прочитать журнал:', err.message);
      return 'Журнал временно недоступен. Остальные страницы продолжают работать.';
    }
  }
  return { middleware, read, flush: () => queue };
}

module.exports = createLogger;
