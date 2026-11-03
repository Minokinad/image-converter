const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const token = localStorage.getItem('token');
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Сервер недоступен. Проверьте подключение и повторите запрос.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(result?.error || `Ошибка сервера (${response.status}).`, response.status);
  if (!result || result.success === false) throw new ApiError(result?.error || 'Некорректный ответ сервера.', response.status);
  return result;
}

export const fetchItems = async (signal) => (await request('/images', { signal })).data;
export const addItem = async (item) => (await request('/images', { method: 'POST', body: item })).data;
export const updateItem = async (id, item) => (await request(`/images/${id}`, { method: 'PUT', body: item })).data;
export const deleteItem = (id) => request(`/images/${id}`, { method: 'DELETE' });
export const login = (credentials) => request('/auth/login', { method: 'POST', body: credentials });
export const register = (credentials) => request('/auth/register', { method: 'POST', body: credentials });
export const fetchProfile = async (signal) => (await request('/auth/profile', { signal })).data;
