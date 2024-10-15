const { Role, DB } = require('../src/database/database.js');
const request = require('supertest');
const app = require('../src/service.js');

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

function randomNumber() {
    return Math.floor(Math.random() * 1000);
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
  
    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}

function generateDinerUser() {
    let user = { password: 'secretuser', roles: [{ role: Role.Diner }] };
    user.name = randomName();
    user.email = user.name + '@diner.com';
  
    return { ...user, password: 'secretuser' };
}

function generateFranchiseeUser() {
    let user = { password: 'secretuser', roles: [{ role: Role.Franchisee }] };
    user.name = randomName();
    user.email = user.name + '@franchisee.com';
  
    return { ...user, password: 'secretuser' };
}

async function registerUser(user) {
    return await request(app).post('/api/auth').send(user);
  }
  
async function loginUser(user) {
    return await request(app).put('/api/auth').send(user);
}

module.exports = { randomName, createAdminUser, randomNumber, generateDinerUser, generateFranchiseeUser, registerUser, loginUser };