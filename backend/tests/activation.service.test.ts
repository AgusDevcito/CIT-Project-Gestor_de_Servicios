import test from "node:test";
import assert from "node:assert";
import * as activationService from "../src/services/activation.service.js";
import * as userRepo from "../src/repositories/user.repository.js";
import { hashPassword } from "../src/helpers/password.js";

let testUserId: number;
let token: string;
const unique = Date.now();

test("Activation token flow", async () => {
    const password = await hashPassword("tempPass123");
    const user = await userRepo.createUserWithProfile(
        { username: `testuser${unique}`, email: `testuser${unique}@example.com`, password, role: "user" },
        { first_name: "Test", last_name: "User" }
    );
    testUserId = user.id;
    token = await activationService.createActivationToken(testUserId, 60 * 1000);
    const updatedUser = await activationService.activateUserWithToken(token, "newSecurePass!2024");
    assert.strictEqual(updatedUser.id, testUserId);
    await assert.rejects(
        activationService.activateUserWithToken(token, "anotherPass"),
        /Token already used/
    );
});

test("should reject expired token", async () => {
    const password = await hashPassword("temp2");
    const user = await userRepo.createUserWithProfile(
        { username: `expuser${unique}`, email: `expuser${unique}@example.com`, password, role: "user" },
        { first_name: "Exp", last_name: "User" }
    );
    const shortToken = await activationService.createActivationToken(user.id, 10);
    await new Promise(res => setTimeout(res, 30));
    await assert.rejects(
        activationService.activateUserWithToken(shortToken, "newPass"),
        /Token expired/
    );
});
