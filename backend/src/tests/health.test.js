import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';

test('GET /health returns OK', async () => {
  const res = await request(app).get('/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'OK');
  assert.ok(res.body.timestamp);
});

test('GET /api/status returns API Running', async () => {
  const res = await request(app).get('/api/status');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'API Running');
  assert.ok(res.body.services);
});

test('Unknown routes return 404', async () => {
  const res = await request(app).get('/api/does-not-exist');

  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Not Found');
});
