const request = require('supertest');
const app = require('../src/service.js');
const { createAdminUser, generateDinerUser, registerUser, loginUser } = require('./testUtils.js');

let admin;
let adminToken;
let userId;
let testDiner;

beforeAll(async () => {
  await request(app).post('/api/auth').send(testDiner);
  testDiner = generateDinerUser();
  admin = await createAdminUser();
  const loginRes = await loginUser(admin);
  adminToken = loginRes.body.token;
  userId = loginRes.body.user.id;
});

test('login', async () => {
  await registerUser(testDiner);
  const loginRes = await request(app).put('/api/auth').send(testDiner);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  expect(loginRes.body.user.id).toBeGreaterThan(0);
  expect(loginRes.body.user.email).toBe(testDiner.email);
  expect(loginRes.body.user.name).toBe(testDiner.name);
});

test('update user', async () => {
  const updateUserRes = await request(app).put(`/api/auth/${userId}`).set('Authorization', `Bearer ${adminToken}`).send({"email":"a@jwt.com", "password":"admin"});
  expect(updateUserRes.status).toBe(200);
});