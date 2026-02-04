import { useState } from 'react';
import { ExportManager } from '@/features/export/ExportManager';

export function ReportBuilder() {
  const [format, setFormat] = useState('pdf');
  const [title, setTitle] = useState('Team Productivity Report');

  const handleExport = () => {
    const report = {
      title,
      generatedAt: new Date().toISOString(),
      metrics: {
        velocity: 18.4,
        bugResolution: 6.2,
        qualityTrend: 2.1,
        engagement: 78
      }
    };
    if (format === 'pdf') {
      // ExportManager.exportAsPDF(report, `${title}.pdf`);
      console.log('PDF export - implement with jsPDF library');
    } else if (format === 'csv') {
      ExportManager.exportAsCSV([report.metrics], Object.keys(report.metrics), `${title}.csv`);
    } else {
      ExportManager.exportAsJSON(report, `${title}.json`);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Custom Report Builder</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate PDF/CSV/JSON reports</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          Export
        </button>
      </div>
    </section>
  );
}
