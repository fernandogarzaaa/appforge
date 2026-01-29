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

test('Security access: only owner can decrypt data', async () => {
  const owner = await createUser();
  const other = await createUser();

  const encryptRes = await request(app)
    .post('/api/security/encrypt')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ data: 'Top Secret', algorithm: 'AES' });

  assert.equal(encryptRes.status, 201);
  const encryptedId = encryptRes.body.data.id;

  const decryptRes = await request(app)
    .post('/api/security/decrypt')
    .set('Authorization', `Bearer ${other.token}`)
    .send({ encryptedId });

  assert.equal(decryptRes.status, 403);
});

test('Security access: only owner can read GDPR status', async () => {
  const owner = await createUser();
  const other = await createUser();

  const gdprRes = await request(app)
    .post('/api/security/gdpr/request')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ requestType: 'deletion', reason: 'Test' });

  assert.equal(gdprRes.status, 201);
  const requestId = gdprRes.body.data.id;

  const statusRes = await request(app)
    .get(`/api/security/gdpr/${requestId}`)
    .set('Authorization', `Bearer ${other.token}`);

  assert.equal(statusRes.status, 403);
});

test('Collaboration roles: collaborator cannot publish, delete, or add collaborators', async () => {
  const owner = await createUser();
  const collaborator = await createUser();

  const createRes = await request(app)
    .post('/api/collaboration/documents')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ title: 'Role Doc', content: 'Text', projectId: 'project-1' });

  assert.equal(createRes.status, 201);
  const docId = createRes.body.data.id;

  const addRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/collaborators`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ collaboratorId: collaborator.user.id, role: 'viewer' });

  assert.equal(addRes.status, 201);

  const publishRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/publish`)
    .set('Authorization', `Bearer ${collaborator.token}`);

  assert.equal(publishRes.status, 403);

  const deleteRes = await request(app)
    .delete(`/api/collaboration/documents/${docId}`)
    .set('Authorization', `Bearer ${collaborator.token}`);

  assert.equal(deleteRes.status, 403);

  const addCollabRes = await request(app)
    .post(`/api/collaboration/documents/${docId}/collaborators`)
    .set('Authorization', `Bearer ${collaborator.token}`)
    .send({ collaboratorId: 'someone-else', role: 'editor' });

  assert.equal(addCollabRes.status, 403);
});

test('Project roles: member can read but cannot modify', async () => {
  const owner = await createUser();
  const member = await createUser();

  const projectRes = await request(app)
    .post('/api/users/projects')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Member Project', description: 'Test' });

  assert.equal(projectRes.status, 201);
  const projectId = projectRes.body.data.id;

  const addMemberRes = await request(app)
    .post(`/api/users/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ memberId: member.user.id, role: 'viewer' });

  assert.equal(addMemberRes.status, 201);

  const getRes = await request(app)
    .get(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${member.token}`);

  assert.equal(getRes.status, 200);

  const updateRes = await request(app)
    .put(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${member.token}`)
    .send({ description: 'Changed' });

  assert.equal(updateRes.status, 403);

  const deleteRes = await request(app)
    .delete(`/api/users/projects/${projectId}`)
    .set('Authorization', `Bearer ${member.token}`);

  assert.equal(deleteRes.status, 403);

  const addMemberAgainRes = await request(app)
    .post(`/api/users/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${member.token}`)
    .send({ memberId: 'another-user', role: 'viewer' });

  assert.equal(addMemberAgainRes.status, 403);
});
