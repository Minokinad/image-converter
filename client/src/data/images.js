export const STORAGE_KEY = 'image-converter.tasks.v1';
export const formats = ['png', 'jpeg', 'webp', 'avif'];
export const statuses = { pending: 'В очереди', completed: 'Выполнена' };
export const filters = { none: 'Без фильтра', grayscale: 'Оттенки серого', sepia: 'Сепия' };

export const initialImages = [
  { id: 'demo-avatar', filename: 'avatar_source.png', originalFormat: 'png', targetFormat: 'webp', width: 500, height: 500, filter: 'grayscale', status: 'completed', fileSize: 128 },
  { id: 'demo-landscape', filename: 'landscape.jpeg', originalFormat: 'jpeg', targetFormat: 'png', width: 1920, height: 1080, filter: 'none', status: 'pending', fileSize: 0 },
];

export function isImageList(value) {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.filename === 'string' && item.filename.trim().length > 0 && item.filename.length <= 255 &&
    formats.includes(item.originalFormat) && formats.includes(item.targetFormat) &&
    Object.hasOwn(statuses, item.status) && Object.hasOwn(filters, item.filter) &&
    [item.width, item.height].every((dimension) => dimension === null || (Number.isInteger(dimension) && dimension > 0 && dimension <= 10000)) &&
    Number.isFinite(item.fileSize) && item.fileSize >= 0,
  ) && new Set(value.map((item) => item.id)).size === value.length;
}
