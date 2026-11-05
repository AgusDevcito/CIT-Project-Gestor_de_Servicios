import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/helpers/password.js";
import { ROL } from "../src/constants/roles.js";
import * as userRepository from "../src/repositories/user.repository.js";

// Helper to login and obtain cookie
async function loginAndGetCookie(username: string, password: string) {
    const res = await request(app).post('/api/login').send({ username, password }).expect(200);
    const token = res.headers['set-cookie']?.[0]?.split('=')[1]?.split(';')[0];
    return token ? `token=${token}` : '';
}

const adminPassword = 'adminPass123';
const adminUsername = `admin${Date.now()}`;
await userRepository.create({
    username: adminUsername,
    email: `${adminUsername}@example.com`,
    password: await hashPassword(adminPassword),
    role: ROL.ADMIN,
});

// 1. Public registration cannot assign ADMIN or CIT role – role is forced to USER
test('public registration ignores role field and creates USER', async () => {
    const unique = Date.now();
    const userPassword = 'userPass123';
    // Attempt to register as ADMIN
    const registerRes = await request(app)
        .post('/api/register')
        .field('username', `adminUser${unique}`)
        .field('email', `adminUser${unique}@example.com`)
        .field('password', userPassword)
        .field('first_name', 'Admin')
        .field('last_name', 'User')
        .field('role', ROL.ADMIN) // client tries to set ADMIN
        .expect(200);

    // Login as the newly created user
    const cookie = await loginAndGetCookie(`adminUser${unique}`, userPassword);
    const profileRes = await request(app)
        .get(`/api/profile/${(await userRepository.findByUsernameWithProfile(`adminUser${unique}`)).id}`)
        .set('Cookie', cookie)
        .expect(200);
    // The profile endpoint returns the user role inside profile.user.role
    assert.equal(profileRes.body.data?.User?.role ?? profileRes.body.data?.role, ROL.USER);
});

// 2. CIT registration creates a USER with document, pending admin approval
test('CIT registration creates USER with document (pending)', async () => {
    const unique = Date.now();
    const userPassword = 'citPass123';
    const registerRes = await request(app)
        .post('/api/register')
        .field('username', `citUser${unique}`)
        .field('email', `citUser${unique}@example.com`)
        .field('password', userPassword)
        .field('first_name', 'CIT')
        .field('last_name', 'User')
        .field('role', ROL.CIT)
        .attach('document', Buffer.from('dummy'), 'cit.pdf')
        .expect(200);

    const cookie = await loginAndGetCookie(`citUser${unique}`, userPassword);
    const profileRes = await request(app)
        .get(`/api/profile/${(await userRepository.findByUsernameWithProfile(`citUser${unique}`)).id}`)
        .set('Cookie', cookie)
        .expect(200);
    // Role must be USER, not CIT, indicating pending approval
    assert.equal(profileRes.body.data?.User?.role ?? profileRes.body.data?.role, ROL.USER);
});

// 3. Normal user cannot change own role via profile update
test('user cannot modify own role through profile update', async () => {
    const unique = Date.now();
    const userPassword = 'normPass123';
    // Register normal user
    await request(app)
        .post('/api/register')
        .field('username', `normUser${unique}`)
        .field('email', `normUser${unique}@example.com`)
        .field('password', userPassword)
        .field('first_name', 'Normal')
        .field('last_name', 'User')
        .expect(200);
    const cookie = await loginAndGetCookie(`normUser${unique}`, userPassword);
    // Attempt to change role via profile endpoint (which only accepts first_name, last_name, avatar_url)
    const updateRes = await request(app)
        .put(`/api/profile/${(await userRepository.findByUsernameWithProfile(`normUser${unique}`)).id}`)
        .set('Cookie', cookie)
        .send({ role: ROL.CIT })
        .expect(200);
    // Verify role unchanged
    const profileRes = await request(app)
        .get(`/api/profile/${(await userRepository.findByUsernameWithProfile(`normUser${unique}`)).id}`)
        .set('Cookie', cookie)
        .expect(200);
    assert.notEqual(profileRes.body.data?.role, ROL.CIT);
});

// 4. Admin can approve CIT request by changing role via user route
test('admin can approve CIT request by assigning CIT role', async () => {
    const unique = Date.now();
    const userPassword = 'pendingPass123';
    // Register CIT request (role forced to USER)
    const registerRes = await request(app)
        .post('/api/register')
        .field('username', `pendingUser${unique}`)
        .field('email', `pendingUser${unique}@example.com`)
        .field('password', userPassword)
        .field('first_name', 'Pending')
        .field('last_name', 'User')
        .field('role', ROL.CIT)
        .attach('document', Buffer.from('dummy'), 'cit.pdf')
        .expect(200);

    // Find the created user id via login (JWT)
    const cookieUser = await loginAndGetCookie(`pendingUser${unique}`, userPassword);
    const profileRes = await request(app)
        .get(`/api/profile/${(await userRepository.findByUsernameWithProfile(`pendingUser${unique}`)).id}`)
        .set('Cookie', cookieUser)
        .expect(200);
    const userId = profileRes.body.data?.User?.id ?? profileRes.body.data?.id;

    // Admin logs in
    const adminCookie = await loginAndGetCookie(adminUsername, adminPassword);
    // Admin updates role via admin-only user route
    await request(app)
        .put(`/api/user/${userId}`)
        .set('Cookie', adminCookie)
        .send({ role: ROL.CIT })
        .expect(200);

    // Verify role updated
    const updatedProfile = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', adminCookie)
        .expect(200);
    assert.equal(updatedProfile.body.data?.User?.role ?? updatedProfile.body.data?.role, ROL.CIT);
});
