import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';

const registerUser = async (overrides = {}) => {
  const payload = {
    email: `user-${Date.now()}@example.com`,
    password: 'StrongPass123!',
    name: 'Test User',
    ...overrides
  };

  return request(app).post('/api/auth/register').send(payload);
};

const loginUser = async (payload) => request(app).post('/api/auth/login').send(payload);

test('Auth validation: register rejects invalid email', async () => {
  const res = await registerUser({ email: 'not-an-email' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation Error');
});

test('Auth validation: register rejects short password', async () => {
  const res = await registerUser({ password: 'short', name: 'Valid Name' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation Error');
});

test('Auth validation: login rejects missing password', async () => {
  const res = await loginUser({ email: 'user@example.com' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation Error');
});

test('Auth failure: login rejects unknown user', async () => {
  const res = await loginUser({ email: 'missing@example.com', password: 'StrongPass123!' });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Error');
});

test('Auth failure: invalid token rejected', async () => {
  const res = await request(app)
    .get('/api/users/profile')
    .set('Authorization', 'Bearer invalid.token.value');

  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Unauthorized');
});

test('Quantum validation: invalid qubits', async () => {
  const registerRes = await registerUser();
  const token = registerRes.body.data.token;

  const res = await request(app)
    .post('/api/quantum/circuits')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Bad Circuit',
      numQubits: 0
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Error');
});

test('Security validation: invalid algorithm', async () => {
  const registerRes = await registerUser();
  const token = registerRes.body.data.token;

  const res = await request(app)
    .post('/api/security/encrypt')
    .set('Authorization', `Bearer ${token}`)
    .send({ data: 'secret', algorithm: 'DES' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Error');
});

test('Collaboration validation: missing title', async () => {
  const registerRes = await registerUser();
  const token = registerRes.body.data.token;

  const res = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId: 'project-1' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Error');
});

test('User validation: missing project name', async () => {
  const registerRes = await registerUser();
  const token = registerRes.body.data.token;

  const res = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'No name' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Error');
});
