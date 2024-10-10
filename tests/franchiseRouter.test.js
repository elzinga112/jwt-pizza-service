const request = require('supertest');
const app = require('../src/service.js');
const { Role, DB } = require('../src/database/database.js');

describe('FranchiseRouter', () => {
  let token;
  let admin;
  let userId;

  beforeAll(async () => {
    admin = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin);
    token = loginRes.body.token;
    userId = loginRes.body.user.id;
    console.log(loginRes.body);
  });
  
  test('get franchise', async () => {
    const getFranchiseRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${token}`);
    expect(getFranchiseRes.status).toBe(200);
  });

  test('get a user franchises', async () => {
    const getFranchiseRes = await request(app).get('/api/franchise/4').set('Authorization', `Bearer ${token}`);
    expect(getFranchiseRes.status).toBe(200);
  });

  test('create franchise', async () => {
    console.log(admin);
    const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json').send({"name": "pizzaPocket1", "admins": [{"email": admin.email}]});
    console.log(createFranchiseRes.body);
    console.log(createFranchiseRes.status);
    
    expect(createFranchiseRes.status).toBe(200);
  });

  test('delete franchise', async () => {
    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(deleteFranchiseRes.status).toBe(200);
  });

  test('create store', async () => {
    const createStoreRes = await request(app).post(`/api/franchise/1/store`).set('Authorization', `Bearer ${token}`).send({"franchiseId": 1, "name":"SLC"});
    expect(createStoreRes.status).toBe(200);
  });

  test('delete store', async () => {
    const deleteStoreRes = await request(app).delete('/api/franchise/1/store/1').set('Authorization', `Bearer ${token}`);
    expect(deleteStoreRes.status).toBe(200);
  });

});

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = "Steven";
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}