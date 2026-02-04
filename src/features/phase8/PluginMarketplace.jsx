import { useState } from 'react';
import { usePluginMarketplace } from './usePluginMarketplace';

export function PluginMarketplace() {
  const { plugins, publishPlugin, installPlugin } = usePluginMarketplace();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');

  const handlePublish = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    publishPlugin({ name, price: Number(price) || 0, rating: 0 });
    setName('');
    setPrice('0');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plugin Marketplace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Publish and manage plugins</p>
      </header>

      <form onSubmit={handlePublish} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Plugin name"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Price"
          className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Publish
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {plugins.map((plugin) => (
          <div key={plugin.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <p className="font-medium text-slate-800 dark:text-slate-100">{plugin.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">${plugin.price.toFixed(2)}</p>
            <button
              type="button"
              onClick={() => installPlugin(plugin.id)}
              className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              {plugin.installed ? 'Installed' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
