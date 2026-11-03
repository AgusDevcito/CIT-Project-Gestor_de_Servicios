import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/helpers/password.js";
import { ROL } from "../src/constants/roles.js";
import * as userRepository from "../src/repositories/user.repository.js";

const unique = Date.now();
// Create admin user
const adminPassword = "adminpass123";
await userRepository.create({
    username: `adminuser${unique}`,
    email: `admin${unique}@example.com`,
    password: await hashPassword(adminPassword),
    role: ROL.ADMIN,
});

// Create regular user
const userPassword = "password123";
await userRepository.create({
    username: `testuser${unique}`,
    email: `test${unique}@example.com`,
    password: await hashPassword(userPassword),
    role: ROL.USER,
});

// Verify users created
const adminCheck = await userRepository.findByUsernameWithProfile(`adminuser${unique}`);
assert.ok(adminCheck, "Admin user should exist");
const userCheck = await userRepository.findByUsernameWithProfile(`testuser${unique}`);
const { comparePasswords } = await import("../src/helpers/password.js");
const adminMatch = await comparePasswords(adminPassword, adminCheck.password);
assert.ok(adminMatch, "Admin password should match");
const userMatch = await comparePasswords(userPassword, userCheck.password);
assert.ok(userMatch, "User password should match");

async function loginAndGetCookie(username: string, password: string) {
    const res = await request(app)
        .post("/api/login")
        .send({ username, password });
    console.log('Login response status', res.status);
    console.log('Login response body', res.body);
    assert.equal(res.status, 200, 'Login should succeed');
    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    return cookie;
}
test("admin can list users", async () => {
    const adminCookie = await loginAndGetCookie(`adminuser${unique}`, adminPassword);
    const res = await request(app)
        .get("/api/users")
        .set("Cookie", adminCookie)
        .expect(200);
    assert.ok(Array.isArray(res.body.data), "Response should contain data array");
    const usernames = res.body.data.map((u: any) => u.username);
    assert.ok(usernames.includes(`adminuser${unique}`), "Admin user should be in list");
    assert.ok(usernames.includes(`testuser${unique}`), "Regular user should be in list");
});

test("non‑admin cannot list users", async () => {
    const userCookie = await loginAndGetCookie(`testuser${unique}`, userPassword);
    await request(app)
        .get("/api/users")
        .set("Cookie", userCookie)
        .expect(403);
});
