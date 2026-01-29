import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';

const createUser = async () => {
  const email = `user-${Date.now()}@example.com`;
  const password = 'StrongPass123!';
  const name = 'Test User';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  assert.equal(registerRes.status, 201);
  const token = registerRes.body.data.token;

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(meRes.status, 200);
  return { token, user: meRes.body.data.user };
};

const createAdminToken = () => {
  const secret = process.env.JWT_SECRET || 'dev-secret-key';
  return jwt.sign(
    { id: 'admin-user', email: 'admin@appforge.io', role: 'admin' },
    secret,
    { expiresIn: '1h' }
  );
};

test('Public access: published collaboration doc readable by other user', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ title: 'Public Doc', content: 'Hello', projectId: 'project-1' });

  assert.equal(createRes.status, 201);
  const docId = createRes.body.data.id;

  const publishRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/publish`)
    .set('Authorization', `Bearer ${owner.token}`);

  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.body.data.isPublic, true);

  const getRes = await request(app)
    .get(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 200);

  const historyRes = await request(app)
    .get(`/api/collaboration/documents/${docId}/history`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(historyRes.status, 200);
  assert.ok(Array.isArray(historyRes.body.data));
});

test('Public access: public circuit readable by other user', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/quantum/circuits')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({
      name: 'Public Circuit',
      description: 'Shared',
      numQubits: 2,
      gates: []
    });

  assert.equal(createRes.status, 201);
  const circuitId = createRes.body.data.id;

  const publishRes = await request(app)
    .put(`/api/quantum/circuits/${circuitId}`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ isPublic: true });

  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.body.data.isPublic, true);

  const getRes = await request(app)
    .get(`/api/quantum/circuits/${circuitId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 200);
});

test('Public access: public project readable by other user', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Public Project', description: 'Shared project' });

  assert.equal(createRes.status, 201);
  const projectId = createRes.body.data.id;

  const publishRes = await request(app)
    .put(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ isPublic: true });

  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.body.data.isPublic, true);

  const getRes = await request(app)
    .get(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 200);
});

test('Role-based auth: compliance report requires admin', async () => {
  const user = await createUser();

  const userRes = await request(app)
    .get('/api/security/compliance')
    .set('Authorization', `Bearer ${user.token}`);

  assert.equal(userRes.status, 403);

  const adminToken = createAdminToken();
  const adminRes = await request(app)
    .get('/api/security/compliance')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(adminRes.status, 200);
  assert.ok(adminRes.body.data.compliance);
});
