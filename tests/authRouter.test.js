const request = require('supertest');
const app = require('../src/service.js');
const { Role, DB } = require('../src/database/database.js');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let admin;
let token;
let userId;


beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;

  admin = await createAdminUser();
  const loginRes = await request(app).put('/api/auth').send(admin);
  token = loginRes.body.token;
  userId = loginRes.body.user.id;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test('update user', async () => {
  const updateUserRes = await request(app).put(`/api/auth/${userId}`).set('Authorization', `Bearer ${token}`).send({"email":"a@jwt.com", "password":"admin"});
  expect(updateUserRes.status).toBe(200);
});

// test('logout', async () => {
//   const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
//   expect(logoutRes.status).toBe(200);
// });

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = "Steven Elzinga";
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}