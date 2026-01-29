import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';

const createTestUser = async () => {
  const email = `user-${Date.now()}@example.com`;
  const password = 'StrongPass123!';
  const name = 'Test User';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  assert.equal(registerRes.status, 201);
  return registerRes.body.data.token;
};

test('Protected routes reject missing token', async () => {
  const quantumRes = await request(app).get('/api/quantum/circuits');
  assert.equal(quantumRes.status, 401);

  const collaborationRes = await request(app).get('/api/collaboration/documents');
  assert.equal(collaborationRes.status, 401);

  const securityRes = await request(app).get('/api/security/rules');
  assert.equal(securityRes.status, 401);

  const usersRes = await request(app).get('/api/users/profile');
  assert.equal(usersRes.status, 401);
});

test('Protected routes accept valid token', async () => {
  const token = await createTestUser();

  const quantumRes = await request(app)
    .post('/api/quantum/circuits')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Circuit',
      description: 'Basic circuit',
      numQubits: 2,
      gates: []
    });

  assert.equal(quantumRes.status, 201);
  assert.equal(quantumRes.body.success, true);

  const collaborationRes = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Doc',
      content: 'Hello',
      projectId: 'project-1'
    });

  assert.equal(collaborationRes.status, 201);
  assert.equal(collaborationRes.body.success, true);

  const securityRes = await request(app)
    .post('/api/security/encrypt')
    .set('Authorization', `Bearer ${token}`)
    .send({
      data: 'Sensitive text',
      algorithm: 'AES'
    });

  assert.equal(securityRes.status, 201);
  assert.equal(securityRes.body.success, true);

  const usersRes = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Project One',
      description: 'Test project'
    });

  assert.equal(usersRes.status, 201);
  assert.equal(usersRes.body.success, true);
});
