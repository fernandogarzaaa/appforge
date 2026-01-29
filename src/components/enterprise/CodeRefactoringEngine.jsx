import React, { useMemo, useState } from 'react';
import { analyzeCode, refactorCode, createRefactorPlan } from '@/utils/refactoringEngine';

export default function CodeRefactoringEngine() {
  const [code, setCode] = useState(`function demo(input) {\n  // TODO: improve\n  var total = 0;\n  if (input) {\n    console.log(input);\n    total += input;\n  }\n  return total;\n}`);
  const [options, setOptions] = useState({
    removeConsole: true,
    normalizeWhitespace: true,
    convertVarToLet: true,
  });

  const analysis = useMemo(() => analyzeCode(code), [code]);
  const plan = useMemo(() => createRefactorPlan(analysis, options), [analysis, options]);
  const [refactored, setRefactored] = useState(null);

  const handleRefactor = () => {
    setRefactored(refactorCode(code, options));
  };

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Code Refactoring Engine</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Run lightweight static analysis and apply safe refactoring transformations.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Lines</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.metrics.lines}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Console Statements</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.metrics.consoleStatements}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Complexity</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.metrics.complexity}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Source Code</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
          <div className="flex flex-wrap gap-3">
            {['removeConsole', 'convertVarToLet', 'normalizeWhitespace'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className="accent-blue-600"
                />
                {key}
              </label>
            ))}
          </div>
          <button
            onClick={handleRefactor}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Run Refactor
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Findings</h2>
            {analysis.issues.length === 0 ? (
              <p className="text-sm text-gray-500">No issues detected.</p>
            ) : (
              analysis.issues.map((issue) => (
                <div key={issue.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{issue.message}</p>
                  <p className="text-xs text-gray-500">Severity: {issue.severity}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Refactor Plan</h2>
            {plan.length === 0 ? (
              <p className="text-sm text-gray-500">No plan generated.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {plan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {refactored && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Refactored Output</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs uppercase text-gray-500">Changes Applied</p>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {refactored.changes.length === 0 ? <li>No changes</li> : refactored.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs uppercase text-gray-500">Refactored Code</p>
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {refactored.refactoredCode}
              </pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
