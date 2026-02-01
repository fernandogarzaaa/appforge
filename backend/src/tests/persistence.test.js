import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongoServer;

const registerAndLogin = async () => {
  const email = `user-${Date.now()}@example.com`;
  const password = 'StrongPass123!';
  const name = 'Test User';

  await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return loginRes.body?.data?.token;
};

before(async () => {
  if (!process.env.MONGODB_URI) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  }
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  const imported = await import('../server.js');
  app = imported.default;
});

after(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('persists user LLM settings', async () => {
  const token = await registerAndLogin();

  const saveRes = await request(app)
    .post('/api/user/llm-settings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      selectedModel: 'chatgpt',
      settings: { temperature: 0.5, maxTokens: 1500 },
      usage: { queryCount: 2 }
    });

  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.body.success, true);

  const getRes = await request(app)
    .get('/api/user/llm-settings')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.selectedModel, 'chatgpt');
  assert.equal(getRes.body.settings.temperature, 0.5);
  assert.equal(getRes.body.usage.queryCount, 2);
});

test('persists team workflows', async () => {
  const token = await registerAndLogin();

  const workflows = [{ id: 'wf-1', name: 'Test Workflow', enabled: true }];
  const webhooks = [{ id: 'wh-1', url: 'https://example.com', event: 'push' }];
  const automations = [{ id: 'auto-1', name: 'Daily Sync', enabled: true }];

  const saveRes = await request(app)
    .post('/api/team/workflows')
    .set('Authorization', `Bearer ${token}`)
    .send({ workflows, webhooks, automations });

  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.body.success, true);

  const getRes = await request(app)
    .get('/api/team/workflows')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.workflows.length, 1);
  assert.equal(getRes.body.webhooks.length, 1);
  assert.equal(getRes.body.automations.length, 1);
});

test('persists admin API configurations', async () => {
  const token = await registerAndLogin();

  const configurations = [
    {
      provider: 'openai',
      name: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      active: true,
      config: { model: 'gpt-4', timeout: 30 }
    }
  ];

  const saveRes = await request(app)
    .post('/api/admin/api-configurations')
    .set('Authorization', `Bearer ${token}`)
    .send({ configurations });

  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.body.success, true);

  const getRes = await request(app)
    .get('/api/admin/api-configurations')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.configurations.length, 1);
  assert.equal(getRes.body.configurations[0].provider, 'openai');
});
