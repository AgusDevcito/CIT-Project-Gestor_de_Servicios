import request from "supertest";
import { app } from "../src/app.js";
import fs from "node:fs";
import path from "node:path";
import { describe, it, after } from "node:test";
import assert from "node:assert";

// Helper to create temp files
const createTempFile = (filename: string, content: Buffer) => {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

const frontImg = createTempFile("front.jpg", Buffer.from([0xff, 0xd8, 0xff])); // valid JPEG header
const backImg = createTempFile("back.jpg", Buffer.from([0xff, 0xd8, 0xff]));
const badFile = createTempFile("bad.txt", Buffer.from("not an image"));

after(() => {
    try { fs.unlinkSync(frontImg); } catch (_) {}
    try { fs.unlinkSync(backImg); } catch (_) {}
    try { fs.unlinkSync(badFile); } catch (_) {}
});

describe("CIT Application file validation", () => {
    it("rejects unsupported file type", async () => {
        const res = await request(app)
            .post("/api/cit-applications")
            .field("first_name", "Ana")
            .field("last_name", "Gomez")
            .field("dni", "87654321")
            .field("email", "ana.gomez@example.com")
            .attach("dni_front", frontImg)
            .attach("dni_back", badFile); // invalid back image
        assert.strictEqual(res.status, 400);
    });
});
