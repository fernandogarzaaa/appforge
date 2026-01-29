import React, { useMemo, useState } from 'react';
import {
  registerModel,
  listModels,
  trainModel,
  listJobs,
  predict,
  recommend,
} from '@/utils/mlIntegration';

export default function MLDashboard() {
  const [models, setModels] = useState(() => listModels());
  const [jobs, setJobs] = useState(() => listJobs());
  const [activeModelId, setActiveModelId] = useState(models[0]?.id || '');
  const [predictionInput, setPredictionInput] = useState('{"userId":"user_1"}');
  const [predictionResult, setPredictionResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const [modelForm, setModelForm] = useState({
    name: 'Recommendation Engine',
    version: '1.0',
    description: 'Personalization model for onboarding',
    type: 'classification',
  });

  const activeModel = useMemo(
    () => models.find((m) => m.id === activeModelId),
    [models, activeModelId]
  );

  const handleRegisterModel = () => {
    const model = registerModel(modelForm);
    const updated = listModels();
    setModels(updated);
    setActiveModelId(model.id);
  };

  const handleTrain = () => {
    if (!activeModelId) return;
    trainModel(activeModelId, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    setJobs(listJobs());
    setModels(listModels());
  };

  const handlePredict = () => {
    if (!activeModelId) return;
    let input;
    try {
      input = JSON.parse(predictionInput);
    } catch {
      input = { raw: predictionInput };
    }
    setPredictionResult(predict(activeModelId, input));
  };

  const handleRecommend = () => {
    setRecommendations(recommend({ latencyMs: 240 }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ML Integration</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage models, training jobs, predictions, and optimization recommendations.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Models Registered</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{models.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Training Jobs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Active Model</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeModel?.name || 'None'}</p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Register Model</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={modelForm.name}
            onChange={(e) => setModelForm((prev) => ({ ...prev, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            placeholder="Model name"
          />
          <input
            value={modelForm.version}
            onChange={(e) => setModelForm((prev) => ({ ...prev, version: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            placeholder="Version"
          />
          <select
            value={modelForm.type}
            onChange={(e) => setModelForm((prev) => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
          <input
            value={modelForm.description}
            onChange={(e) => setModelForm((prev) => ({ ...prev, description: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            placeholder="Description"
          />
        </div>
        <button
          onClick={handleRegisterModel}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Register Model
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Training & Predictions</h2>
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Active Model</label>
            <select
              value={activeModelId}
              onChange={(e) => setActiveModelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            >
              <option value="">Select model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.version})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTrain}
              disabled={!activeModelId}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Train Model
            </button>
            <button
              onClick={handleRecommend}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Get Recommendations
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-500">Prediction Input (JSON)</label>
            <textarea
              value={predictionInput}
              onChange={(e) => setPredictionInput(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
            <button
              onClick={handlePredict}
              disabled={!activeModelId}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Run Prediction
            </button>
          </div>

          {predictionResult && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <pre className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(predictionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No training jobs yet.</p>
          ) : (
            jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{job.id}</span>
                  <span className="text-xs text-gray-500">{job.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Samples: {job.samples}</p>
                {job.metrics && (
                  <p className="text-xs text-gray-500">Accuracy: {job.metrics.accuracy.toFixed(2)}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Optimization Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-500">No recommendations yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <p className="font-medium text-gray-900 dark:text-white">{rec.title}</p>
                <p className="text-xs text-gray-500">Impact: {rec.impact}</p>
                <p className="text-xs text-gray-500">Effort: {rec.effort}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
