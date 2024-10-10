const request = require('supertest');
const app = require('../src/service.js');
const { Role, DB } = require('../src/database/database.js');

describe('Database', () => {
  let token;
  let admin;

  beforeAll(async () => {
    admin = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin);
    token = loginRes.body.token;
  });
  
  test('add items to menu', async () => {
    const addMenuRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${token}`).send({ "title":"Veggie", "description": "A garden of delight", "image":"pizza1.png", "price": 0.0038 });
    expect(addMenuRes.status).toBe(200);
    expect(addMenuRes.body[0].title).toEqual("Veggie");
  });

  test('get menu', async () => {
    await request(app).put('/api/order/menu').set('Authorization', `Bearer ${token}`).send({ "title":"Veggie", "description": "A garden of delight", "image":"pizza1.png", "price": 0.0038 });
    const getMenuRes = await request(app).get('/api/order/menu').set('Authorization', `Bearer ${token}`);
  
    expect(getMenuRes.status).toBe(200);
  });

  test('create order', async () => {
    const createOrderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${token}`).send({ franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] });
    expect(createOrderRes.status).toBe(200);
  });

  test('get orders', async () => {
    const getOrdersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${token}`);
    expect(getOrdersRes.status).toBe(200);
  });


});

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = "Steven E";
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}