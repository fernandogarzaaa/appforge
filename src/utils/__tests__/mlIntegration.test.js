import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerModel,
  listModels,
  trainModel,
  listJobs,
  predict,
  recommend,
  resetMlRegistry,
} from '@/utils/mlIntegration';

describe('ML Integration Utilities', () => {
  beforeEach(() => {
    resetMlRegistry();
  });

  it('registers models and lists them', () => {
    const model = registerModel({ name: 'Recommendation Engine', type: 'classification' });
    const models = listModels();

    expect(models.length).toBe(1);
    expect(models[0].id).toBe(model.id);
    expect(models[0].name).toBe('Recommendation Engine');
  });

  it('trains models and tracks jobs', () => {
    const model = registerModel({ name: 'Fraud Detector', type: 'classification' });
    const job = trainModel(model.id, [{ id: 1 }, { id: 2 }]);

    expect(job.status).toBe('completed');
    expect(job.samples).toBe(2);
    expect(listJobs().length).toBe(1);
  });

  it('produces predictions', () => {
    const model = registerModel({ name: 'Churn Model', type: 'classification' });
    const result = predict(model.id, { userId: 'user_1' });

    expect(result.modelId).toBe(model.id);
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('prediction');
  });

  it('returns recommendations with context', () => {
    const recs = recommend({ latencyMs: 250 });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].id).toBe('rec_latency');
  });
});
