import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'appforge_scheduled_tasks';

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // no-op
  }
};

export function useScheduledTasks() {
  const [tasks, setTasks] = useState(loadTasks);

  const addTask = useCallback((task) => {
    const next = [{ ...task, id: Date.now() }, ...tasks].slice(0, 100);
    setTasks(next);
    saveTasks(next);
  }, [tasks]);

  const removeTask = useCallback((taskId) => {
    const next = tasks.filter((task) => task.id !== taskId);
    setTasks(next);
    saveTasks(next);
  }, [tasks]);

  const updateTask = useCallback((taskId, updates) => {
    const next = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
    setTasks(next);
    saveTasks(next);
  }, [tasks]);

  const activeTasks = useMemo(() => tasks.filter((task) => task.enabled !== false), [tasks]);

  return {
    tasks,
    activeTasks,
    addTask,
    removeTask,
    updateTask
  };
}
