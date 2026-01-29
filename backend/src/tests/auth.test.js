import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';

test('Authentication flow: register, login, me, refresh', async () => {
  const email = `user-${Date.now()}@example.com`;
  const password = 'StrongPass123!';
  const name = 'Test User';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  assert.equal(registerRes.status, 201);
  assert.equal(registerRes.body.success, true);
  assert.ok(registerRes.body.data.token);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.success, true);
  assert.ok(loginRes.body.data.token);

  const token = loginRes.body.data.token;

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.success, true);
  assert.equal(meRes.body.data.user.email, email);

  const refreshRes = await request(app)
    .post('/api/auth/refresh')
    .send({ token });

  assert.equal(refreshRes.status, 200);
  assert.equal(refreshRes.body.success, true);
  assert.ok(refreshRes.body.data.token);
});
