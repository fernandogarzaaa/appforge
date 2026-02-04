import { useState } from 'react';
import { useIntegrationBuilder } from './useIntegrationBuilder';

export function IntegrationBuilder() {
  const { flows, addFlow } = useIntegrationBuilder();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('webhook.received');
  const [action, setAction] = useState('send.slack');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    addFlow({ name, trigger, action, status: 'draft' });
    setName('');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Integration Builder</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Create low-code integration flows</p>
      </header>

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 sm:grid-cols-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Flow name"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={trigger}
          onChange={(event) => setTrigger(event.target.value)}
          placeholder="Trigger"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Action"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Add Flow
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {flows.map((flow) => (
          <div key={flow.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <p className="font-medium text-slate-800 dark:text-slate-100">{flow.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Trigger: {flow.trigger}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Action: {flow.action}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
