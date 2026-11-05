import request from "supertest";
import { app } from "../src/app.js";
import fs from "node:fs";
import path from "node:path";
import { describe, it, after } from "node:test";
import assert from "node:assert";

// Helper to create a temporary image file (minimal JPEG header)
const createTempImage = (filename: string) => {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, Buffer.from([0xff, 0xd8, 0xff])); // minimal JPEG header
    return filePath;
};

const frontImg = createTempImage("front.jpg");
const backImg = createTempImage("back.jpg");

after(() => {
    // cleanup temp files
    try { fs.unlinkSync(frontImg); } catch (_) {}
    try { fs.unlinkSync(backImg); } catch (_) {}
});

describe("CIT Application endpoints", () => {
    it("should accept a valid application", async () => {
        const res = await request(app)
            .post("/api/cit-applications")
            .field("first_name", "Juan")
            .field("last_name", "Perez")
            .field("dni", "12345678")
            .field("email", "juan.perez@example.com")
            .attach("dni_front", frontImg)
            .attach("dni_back", backImg);
        assert.strictEqual(res.status, 201);
        assert.ok(res.body.data.id);
    });

    it("should reject missing first name", async () => {
        const res = await request(app)
            .post("/api/cit-applications")
            .field("last_name", "Perez")
            .field("dni", "12345679")
            .field("email", "juan2.perez@example.com")
            .attach("dni_front", frontImg)
            .attach("dni_back", backImg);
        assert.strictEqual(res.status, 400);
    });
});
