import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/helpers/password.js";
import { ROL } from "../src/constants/roles.js";
import * as userRepository from "../src/repositories/user.repository.js";
import { verifyToken } from "../src/helpers/jwt.js";

const unique = Date.now();

// Create admin user (no profile needed for admin actions)
const adminPassword = "adminpass123";
await userRepository.create({
    username: `admin${unique}`,
    email: `admin${unique}@example.com`,
    password: await hashPassword(adminPassword),
    role: ROL.ADMIN,
});

// Create regular user with profile using repository helper
const userPassword = "userpass123";
const createdUser = await userRepository.createUserWithProfile(
    {
        username: `user${unique}`,
        email: `user${unique}@example.com`,
        password: await hashPassword(userPassword),
        role: ROL.USER,
        document_url: null,
        document_name: null,
    },
    {
        first_name: "Original",
        last_name: "User",
        avatar_url: null,
    },
);
console.log('Created user id', createdUser.id);


async function loginAndGetCookie(username: string, password: string) {
    const res = await request(app).post("/api/login").send({ username, password }).expect(200);
    const token = res.headers["set-cookie"]?.[0]?.split('=')[1]?.split(';')[0];
    const payload = token ? verifyToken(token) : null;
    console.log('Login payload', payload);
    return res.headers["set-cookie"]?.[0] ?? "";
}

test("user can get own profile", async () => {
    const cookie = await loginAndGetCookie(`user${unique}`, userPassword);
    const res = await request(app)
        .get(`/api/profile/${createdUser.id}`)
        .set("Cookie", cookie)
        .expect(200);
    assert.equal(res.body.data.first_name, "Original");
    assert.equal(res.body.data.last_name, "User");
});

test("user can update own profile", async () => {
    const cookie = await loginAndGetCookie(`user${unique}`, userPassword);
    const res = await request(app)
        .put(`/api/profile/${createdUser.id}`)
        .set("Cookie", cookie)
        .send({ first_name: "Nuevo", last_name: "Nombre", avatar_url: "http://example.com/avatar.png" })
        .expect(200);
    assert.equal(res.body.msg, "Perfil actualizado");
    // Verify changes persisted
    const getRes = await request(app)
        .get(`/api/profile/${createdUser.id}`)
        .set("Cookie", cookie)
        .expect(200);
    assert.equal(getRes.body.data.first_name, "Nuevo");
    assert.equal(getRes.body.data.last_name, "Nombre");
    assert.equal(getRes.body.data.avatar_url, "http://example.com/avatar.png");
});

test("other user cannot update profile of another user", async () => {
    // login as admin
    const adminCookie = await loginAndGetCookie(`admin${unique}`, adminPassword);
    await request(app)
        .put(`/api/profile/${createdUser.id}`)
        .set("Cookie", adminCookie)
        .send({ first_name: "Hack" })
        .expect(403);
});
