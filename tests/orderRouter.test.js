const request = require('supertest');
const app = require('../src/service.js');
const { createAdminUser, generateDinerUser, registerUser, loginUser } = require('./testUtils.js');

describe('Database', () => {
  let adminToken;
  let admin;
  let dinerUser;
  let dinerToken;

  beforeAll(async () => {
    admin = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin);
    adminToken = loginRes.body.token;

    dinerUser = generateDinerUser();
    await registerUser(dinerUser);
    const loginFranchiseeRes = await loginUser(dinerUser);
    dinerToken = loginFranchiseeRes.body.token;
  });

  async function addItemToMenu(token) {
    return await request(app)
      .put('/api/order/menu')
      .set('Authorization', `Bearer ${token}`)
      .send({ "title":"Veggie", "description": "A garden of delight", "image":"pizza1.png", "price": 0.0038 });
  }

  test('add items to menu', async () => {
    const addMenuRes = await addItemToMenu(adminToken);
    expect(addMenuRes.status).toBe(200);
    expect(addMenuRes.body[0].title).toEqual("Veggie");
  });

  test('get menu', async () => {
    await addItemToMenu(adminToken);
    const getMenuRes = await request(app).get('/api/order/menu').set('Authorization', `Bearer ${dinerToken}`);
    expect(getMenuRes.status).toBe(200);
    expect(getMenuRes.body.some(item => item.title === 'Veggie')).toBeTruthy();
  });

  test('create order with diner', async () => {
    const createOrderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${dinerToken}`).send({ franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] });
    const order = createOrderRes.body.order;

    expect(order.franchiseId).toBe(1);
    expect(order.storeId).toBe(1);
    expect(order.items.some(item => item.menuId === 1)).toBeTruthy();
    expect(createOrderRes.status).toBe(200);
  });

  test('get orders with diner', async () => {
    await request(app).post('/api/order').set('Authorization', `Bearer ${dinerToken}`).send({ franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] });
    const getOrdersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${dinerToken}`);
    const orders = getOrdersRes.body.orders;

    expect(getOrdersRes.status).toBe(200);
    expect(orders.some(item => item.storeId === 1)).toBeTruthy();
    expect(orders.some(item => item.franchiseId === 1)).toBeTruthy();
    expect(orders.find(item => item.storeId === 1).items.some(item => item.description === "Veggie")).toBeTruthy();
  });
});