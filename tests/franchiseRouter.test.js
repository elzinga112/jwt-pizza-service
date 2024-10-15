const request = require('supertest');
const app = require('../src/service.js');
const { createAdminUser, randomName, generateFranchiseeUser, registerUser, loginUser } = require('./testUtils.js');

describe('FranchiseRouter', () => {
  let adminToken;
  let admin;
  let adminUserId;
  let franchiseeToken;
  let franchiseeUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    const loginRes = await loginUser(admin);
    adminToken = loginRes.body.token;
    adminUserId = loginRes.body.user.id;

    franchiseeUser = generateFranchiseeUser();
    await registerUser(franchiseeUser);
    const loginFranchiseeRes = await loginUser(franchiseeUser);
    franchiseeToken = loginFranchiseeRes.body.token;
  });

  async function createFranchise(name, admins) {
    return await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send({ name, admins });
  };

  async function createStore(name, franchiseId, token) {
    return await request(app)
      .post(`/api/franchise/${franchiseId}/store`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ "franchiseId": franchiseId, "name": name });
  };
  
  test('get all franchise', async () => {
    const admins = [{"email": admin.email}];
    const name = `pizza${Math.random()}${Math.random()}`;
    await createFranchise(name, admins);
    const getFranchiseRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${adminToken}`);
    expect(getFranchiseRes.status).toBe(200);
    expect(getFranchiseRes.body.find(franchise => franchise.name === name)).toBeTruthy();
  });

  test('add a franchise, then get a user franchises', async () => {
    const admins = [{"email": admin.email}];
    const name = `pizza${Math.random()}${Math.random()}`;
    await createFranchise(name, admins);
    const getFranchiseRes = await request(app).get(`/api/franchise/${adminUserId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getFranchiseRes.status).toBe(200);
    expect(getFranchiseRes.body.find(franchise => franchise.name === name)).toBeTruthy();
  });

  test('create franchise', async () => {
    const admins = [{"email": admin.email}];
    const name = `pizza${Math.random()}${Math.random()}`;
    const createFranchiseRes = await createFranchise(name, admins);
    expect(createFranchiseRes.status).toBe(200);
    expect(createFranchiseRes.body.admins.find(admin => admin.email === admins[0].email)).toBeTruthy();
  });

  test('successfully delete franchise', async () => {
    const admins = [{"email": admin.email}];
    const name = `pizza${Math.random()}${Math.random()}`;
    await createFranchise(name, admins);
    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${adminUserId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
    expect(deleteFranchiseRes.body.message).toBe('franchise deleted');
  });

  test('successfully create store with franchisee', async () => {
    const admins = [{"email": franchiseeUser.email}];
    const franchiseName = `pizza${Math.random()}${Math.random()}`;
    const createFranchiseRes = await createFranchise(franchiseName, admins);
    const franchiseId = createFranchiseRes.body.id;

    const name = randomName();
    const createStoreRes = await createStore(name, franchiseId, franchiseeToken);
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe(name);
    expect(createStoreRes.body.franchiseId).toBe(franchiseId);
  });

  test('successfully delete store with franchisee', async () => {
    const admins = [{"email": admin.email}];
    const franchiseName = `pizza${Math.random()}${Math.random()}`;
    const createFranchiseRes = await createFranchise(franchiseName, admins);
    const franchiseId = createFranchiseRes.body.id;

    const storeName = randomName();
    const createStoreRes = await createStore(storeName, franchiseId, franchiseeToken);
    const storeId = createStoreRes.body.id;

    const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteStoreRes.status).toBe(200);
    expect(deleteStoreRes.body.message).toBe('store deleted');
  });
});
