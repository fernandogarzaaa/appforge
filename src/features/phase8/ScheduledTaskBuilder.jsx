import { useState } from 'react';
import { useScheduledTasks } from './useScheduledTasks';

export function ScheduledTaskBuilder() {
  const { tasks, addTask, removeTask } = useScheduledTasks();
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 9 * * 1-5');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    addTask({ name, cron, enabled: true });
    setName('');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scheduled Task Builder</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Create cron-based automations</p>
      </header>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Task name"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={cron}
          onChange={(event) => setCron(event.target.value)}
          placeholder="Cron expression"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Add Task
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{task.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{task.cron}</p>
            </div>
            <button
              type="button"
              onClick={() => removeTask(task.id)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
