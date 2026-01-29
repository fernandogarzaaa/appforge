import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';

const registerAndLogin = async () => {
  const email = `user-${Date.now()}@example.com`;
  const password = 'StrongPass123!';
  const name = 'Test User';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  assert.equal(registerRes.status, 201);
  return registerRes.body.data.token;
};

const createAdminToken = () => {
  const secret = process.env.JWT_SECRET || 'dev-secret-key';
  return jwt.sign(
    { id: 'admin-user', email: 'admin@appforge.io', role: 'admin' },
    secret,
    { expiresIn: '1h' }
  );
};

test('Quantum circuit simulate + export', async () => {
  const token = await registerAndLogin();

  const createRes = await request(app)
    .post('/api/quantum/circuits')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Sim Circuit',
      description: 'For simulation',
      numQubits: 2,
      gates: []
    });

  assert.equal(createRes.status, 201);
  const circuitId = createRes.body.data.id;

  const simulateRes = await request(app)
    .post(`/api/quantum/circuits/${circuitId}/simulate`)
    .set('Authorization', `Bearer ${token}`)
    .send({ shots: 200 });

  assert.equal(simulateRes.status, 200);
  assert.ok(simulateRes.body.data.counts);

  const exportRes = await request(app)
    .get(`/api/quantum/circuits/${circuitId}/export?format=json`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(exportRes.status, 200);
  assert.equal(exportRes.body.data.format, 'json');
});

test('Collaboration history + publish toggles', async () => {
  const token = await registerAndLogin();

  const createRes = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Doc One',
      content: 'Initial',
      projectId: 'project-1'
    });

  assert.equal(createRes.status, 201);
  const docId = createRes.body.data.id;

  const updateRes = await request(app)
    .put(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content: 'Updated content' });

  assert.equal(updateRes.status, 200);

  const historyRes = await request(app)
    .get(`/api/collaboration/documents/${docId}/history`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(historyRes.status, 200);
  assert.ok(Array.isArray(historyRes.body.data));

  const publishRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/publish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.body.data.isPublic, true);

  const unpublishRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/unpublish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(unpublishRes.status, 200);
  assert.equal(unpublishRes.body.data.isPublic, false);
});

test('Security GDPR request + compliance report', async () => {
  const token = await registerAndLogin();

  const gdprRes = await request(app)
    .post('/api/security/gdpr/request')
    .set('Authorization', `Bearer ${token}`)
    .send({ requestType: 'deletion', reason: 'Test request' });

  assert.equal(gdprRes.status, 201);
  const requestId = gdprRes.body.data.id;

  const statusRes = await request(app)
    .get(`/api/security/gdpr/${requestId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.body.data.id, requestId);

  const adminToken = createAdminToken();
  const complianceRes = await request(app)
    .get('/api/security/compliance')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(complianceRes.status, 200);
  assert.ok(complianceRes.body.data.compliance);
});

test('User project members flow', async () => {
  const token = await registerAndLogin();

  const projectRes = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Members Project', description: 'Test' });

  assert.equal(projectRes.status, 201);
  const projectId = projectRes.body.data.id;

  const addRes = await request(app)
    .post(`/api/users/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${token}`)
    .send({ memberId: 'user-2', role: 'viewer' });

  assert.equal(addRes.status, 201);

  const membersRes = await request(app)
    .get(`/api/users/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(membersRes.status, 200);
  assert.ok(Array.isArray(membersRes.body.data));

  const statsRes = await request(app)
    .get(`/api/users/projects/${projectId}/stats`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(statsRes.status, 200);
  assert.equal(statsRes.body.data.projectId, projectId);
});
