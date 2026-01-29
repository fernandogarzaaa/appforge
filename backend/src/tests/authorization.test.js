import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
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

test('Quantum access: non-owner forbidden', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/quantum/circuits')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({
      name: 'Owner Circuit',
      description: 'Private',
      numQubits: 2,
      gates: []
    });

  assert.equal(createRes.status, 201);
  const circuitId = createRes.body.data.id;

  const getRes = await request(app)
    .get(`/api/quantum/circuits/${circuitId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 403);

  const updateRes = await request(app)
    .put(`/api/quantum/circuits/${circuitId}`)
    .set('Authorization', `Bearer ${other.token}`)
    .send({ name: 'Hacked' });

  assert.equal(updateRes.status, 403);

  const deleteRes = await request(app)
    .delete(`/api/quantum/circuits/${circuitId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(deleteRes.status, 403);
});

test('Collaboration access: non-owner forbidden for private docs', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({
      title: 'Private Doc',
      content: 'Secret',
      projectId: 'project-1'
    });

  assert.equal(createRes.status, 201);
  const docId = createRes.body.data.id;

  const getRes = await request(app)
    .get(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 403);

  const updateRes = await request(app)
    .put(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${other.token}`)
    .send({ content: 'Tampered' });

  assert.equal(updateRes.status, 403);

  const deleteRes = await request(app)
    .delete(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(deleteRes.status, 403);

  const addCollabRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/collaborators`)
    .set('Authorization', `Bearer ${other.token}`)
    .send({ collaboratorId: other.user.id, role: 'editor' });

  assert.equal(addCollabRes.status, 403);
});

test('Project access: non-owner forbidden for private project', async () => {
  const owner = await createUser();
  const other = await createUser();

  const createRes = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Private Project', description: 'Secret' });

  assert.equal(createRes.status, 201);
  const projectId = createRes.body.data.id;

  const getRes = await request(app)
    .get(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(getRes.status, 403);

  const updateRes = await request(app)
    .put(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${other.token}`)
    .send({ name: 'Renamed' });

  assert.equal(updateRes.status, 403);

  const deleteRes = await request(app)
    .delete(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(deleteRes.status, 403);

  const addMemberRes = await request(app)
    .post(`/api/users/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${other.token}`)
    .send({ memberId: other.user.id, role: 'viewer' });

  assert.equal(addMemberRes.status, 403);
});
