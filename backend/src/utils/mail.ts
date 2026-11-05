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

/**
 * Notifica a los administradores la nueva solicitud de acceso CIT.
 */
export const sendCitApplicationNotification = async (adminEmails: string[], applicationId: number) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
        to: adminEmails,
        subject: "Nueva solicitud de acceso CIT pendiente de revisión",
        text: `Se ha recibido una nueva solicitud de acceso al CIT (ID: ${applicationId}).\n\nRevisa la solicitud en el panel administrativo.`,
    };
    await transporter.sendMail(mailOptions);
};

/**
 * Notifica al solicitante el resultado de su solicitud.
 */
/**
 * Envía un email con enlace de restablecimiento de contraseña.
 */
export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
    to,
    subject: "Restablecimiento de contraseña",
    text: `Hola,\n\nPara restablecer tu contraseña, haz click en el siguiente enlace (válido 15 minutos): ${resetLink}\n\nSi no solicitaste este cambio, puedes ignorar este mensaje.`,
  };
  await transporter.sendMail(mailOptions);
};

    to: string,
    applicationId: number,
    approved: boolean,
    token?: string,
    rejectionReason?: string,
) => {
    const subject = approved
        ? "Tu solicitud de acceso al sistema CIT fue aprobada"
        : "Actualización de tu solicitud de acceso CIT";
    const body = approved
        ? `Hola,\n\nTu solicitud (ID: ${applicationId}) ha sido aprobada.\n\nUtiliza el siguiente enlace para establecer tu contraseña: ${process.env.FRONTEND_URL}/activate-cit/${token}\n\nEste enlace es válido por 24 horas.\n\nSaludos.`
        : `Hola,\n\nTu solicitud (ID: ${applicationId}) ha sido rechazada.\n\nMotivo: ${rejectionReason}\n\nSi consideras que hay un error, por favor contacta al soporte.`;
    const mailOptions = {
        from: process.env.EMAIL_FROM ?? "Gestor de Servicios <no-reply@example.com>",
        to,
        subject,
        text: body,
    };
    await transporter.sendMail(mailOptions);
};
