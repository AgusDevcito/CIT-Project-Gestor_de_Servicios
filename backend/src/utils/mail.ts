import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Configuración del transportador de correo usando variables de entorno.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: env.db.ssl || (process.env.EMAIL_SECURE === "true"), // true for 465, false otherwise
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Envía un email de bienvenida al registro de usuario.
 */
export const sendRegistrationEmail = async (
    to: string,
    username: string,
): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
        to,
        subject: "Bienvenido a Gestor de Servicios",
        text: `Hola ${username},\n\nGracias por registrarte en Gestor de Servicios. Tu cuenta está activa.`,
    };
    await transporter.sendMail(mailOptions);
};

/**
 * Notifica al usuario el cambio de estado de una solicitud.
 */
export const sendSolicitudStatusEmail = async (
    to: string,
    solicitudId: number,
    estadoNombre: string,
): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
        to,
        subject: `Actualización de solicitud #${solicitudId}`,
        text: `Su solicitud con ID ${solicitudId} ha cambiado al estado: ${estadoNombre}.`,
    };
    await transporter.sendMail(mailOptions);
};
