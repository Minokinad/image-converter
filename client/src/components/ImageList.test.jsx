import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageList from './ImageList.jsx';
import { initialImages, STORAGE_KEY } from '../data/images.js';

function advance(ms) {
  act(() => vi.advanceTimersByTime(ms));
}

function start() {
  const view = render(<StrictMode><ImageList /></StrictMode>);
  advance(1000);
  return view;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Задачи конвертации', () => {
  it('загружает примеры за секунду, сохраняет через 500 мс и меняет заголовок', () => {
    render(<StrictMode><ImageList /></StrictMode>);
    expect(screen.getByText('Загрузка задач…')).toBeInTheDocument();
    advance(999);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    advance(1);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(document.title).toBe('Задач: 2 · Конвертер изображений');
    advance(499);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    advance(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(initialImages);
    expect(screen.getByRole('status')).toHaveTextContent('Все изменения сохранены');
  });

  it('добавляет, редактирует и удаляет задачи с сохранением после перемонтирования', () => {
    const view = start();
    fireEvent.change(screen.getByLabelText('Имя файла'), { target: { value: 'test.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать test.png' }));
    fireEvent.change(screen.getByLabelText('Имя файла'), { target: { value: 'edited.png' } });
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'completed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    expect(within(screen.getByRole('article', { name: 'Задача edited.png' })).getByText('Выполнена')).toBeInTheDocument();
    advance(500);
    view.unmount();
    const restored = start();
    expect(screen.getByRole('article', { name: 'Задача edited.png' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить edited.png' }));
    advance(500);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(2);
    restored.unmount();
    start();
    expect(screen.queryByRole('article', { name: 'Задача edited.png' })).not.toBeInTheDocument();
  });

  it('применяет поиск, фильтры и сортировку, не меняя сохранённые данные', () => {
    start();
    fireEvent.change(screen.getByLabelText('Статус задач'), { target: { value: 'pending' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('landscape.jpeg')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Статус задач'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Формат результата'), { target: { value: 'webp' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Формат результата'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Поиск по имени'), { target: { value: 'LANDSCAPE' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Поиск по имени'), { target: { value: 'нет такого файла' } });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Поиск по имени'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Сортировка'), { target: { value: 'name' } });
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Задача avatar_source.png');
    fireEvent.change(screen.getByLabelText('Сортировка'), { target: { value: 'size' } });
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Задача avatar_source.png');
    advance(500);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(initialImages);
  });

  it('не восстанавливает примеры после удаления всех задач', () => {
    const view = start();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить avatar_source.png' }));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить landscape.jpeg' }));
    advance(500);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
    view.unmount();
    start();
    expect(screen.getByText('Задач пока нет')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it.each(['{broken', '{}', '[{"id":"bad"}]'])('обрабатывает повреждённые данные: %s', (stored) => {
    localStorage.setItem(STORAGE_KEY, stored);
    start();
    expect(screen.getByRole('alert')).toHaveTextContent('Загружены примеры');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('показывает ошибку записи, сохраняя возможность работать со списком', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    start();
    advance(500);
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить avatar_source.png' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('обрабатывает запрет чтения localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Denied'); });
    start();
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось прочитать');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('отменяет предыдущий таймер сохранения при следующих изменениях', () => {
    start();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить avatar_source.png' }));
    advance(400);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить landscape.jpeg' }));
    advance(499);
    expect(write).not.toHaveBeenCalled();
    advance(1);
    expect(write).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, '[]');
  });

  it('очищает таймеры и восстанавливает заголовок при размонтировании', () => {
    document.title = 'Исходный заголовок';
    const view = start();
    view.unmount();
    advance(1000);
    expect(document.title).toBe('Исходный заголовок');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('отменяет редактирование и отклоняет пробельное имя файла', () => {
    start();
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать avatar_source.png' }));
    fireEvent.change(screen.getByLabelText('Имя файла'), { target: { value: 'changed.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.getByLabelText('Имя файла')).toHaveValue('');
    expect(screen.getByText('avatar_source.png')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Имя файла'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    expect(screen.getByRole('alert')).toHaveTextContent('непробельный');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
