import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import OutboxNotification from "../models/outboxNotification.model.js";
import * as outboxRepo from "../repositories/outbox.repository.js";

// Reuse transporter configuration similar to utils/mail.ts
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: env.db.ssl || (process.env.EMAIL_SECURE === "true"),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const MAX_ATTEMPTS = 3;

export const processOutbox = async () => {
    const pending = await outboxRepo.findPending();
    for (const notification of pending) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
                to: notification.recipient,
                subject: notification.subject,
                text: notification.body,
            });
            await outboxRepo.markSent(notification.id);
        } catch (err) {
            // Increment attempts
            const attempts = (notification.attempts ?? 0) + 1;
            if (attempts >= MAX_ATTEMPTS) {
                await outboxRepo.markFailed(notification.id);
            } else {
                // update attempts count
                await OutboxNotification.update({ attempts }, { where: { id: notification.id } });
            }
        }
    }
};

// If running as a standalone process, start a loop (e.g., every minute)
if (import.meta?.url === `file://${process.argv[1]}`) {
    setInterval(() => {
        processOutbox().catch(console.error);
    }, 60_000);
}
