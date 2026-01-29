/**
 * ML Integration Utilities
 * Lightweight in-memory ML registry with training jobs, predictions, and recommendations.
 */

const MODELS = new Map();
const JOBS = [];

const MAX_JOBS = 100;

const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

export const registerModel = ({ name, version = '1.0', description = '', type = 'classification', features = [] }) => {
  const id = generateId('model');
  const model = {
    id,
    name,
    version,
    description,
    type,
    features,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ready',
    metrics: {
      accuracy: 0.92,
      precision: 0.88,
      recall: 0.9,
    },
  };
  MODELS.set(id, model);
  return model;
};

export const listModels = () => Array.from(MODELS.values());

export const getModel = (id) => MODELS.get(id) || null;

export const trainModel = (modelId, trainingData = []) => {
  const model = MODELS.get(modelId);
  if (!model) throw new Error('Model not found');

  const job = {
    id: generateId('job'),
    modelId,
    status: 'running',
    createdAt: Date.now(),
    completedAt: null,
    metrics: null,
    samples: trainingData.length,
  };

  JOBS.unshift(job);
  if (JOBS.length > MAX_JOBS) JOBS.pop();

  // Simulate training completion
  job.status = 'completed';
  job.completedAt = Date.now();
  job.metrics = {
    accuracy: 0.9 + Math.random() * 0.08,
    loss: 0.2 + Math.random() * 0.1,
  };

  model.updatedAt = Date.now();
  model.metrics = {
    accuracy: Number(job.metrics.accuracy.toFixed(3)),
    precision: 0.86,
    recall: 0.89,
  };

  return job;
};

export const listJobs = () => [...JOBS];

export const predict = (modelId, input = {}) => {
  const model = MODELS.get(modelId);
  if (!model) throw new Error('Model not found');

  const score = Math.min(0.99, Math.max(0.01, Math.random()));

  return {
    modelId,
    prediction: model.type === 'regression' ? Number((score * 100).toFixed(2)) : score > 0.5 ? 'positive' : 'negative',
    confidence: Number(score.toFixed(2)),
    input,
  };
};

export const recommend = (context = {}) => {
  const base = [
    { id: 'rec_1', title: 'Enable caching layer', impact: 'high', effort: 'medium' },
    { id: 'rec_2', title: 'Increase batch size', impact: 'medium', effort: 'low' },
    { id: 'rec_3', title: 'Optimize feature store', impact: 'high', effort: 'high' },
  ];

  if (context?.latencyMs > 200) {
    return [{ id: 'rec_latency', title: 'Reduce model latency with distillation', impact: 'high', effort: 'medium' }, ...base];
  }

  return base;
};

export const resetMlRegistry = () => {
  MODELS.clear();
  JOBS.length = 0;
};

export default {
  registerModel,
  listModels,
  getModel,
  trainModel,
  listJobs,
  predict,
  recommend,
  resetMlRegistry,
};
