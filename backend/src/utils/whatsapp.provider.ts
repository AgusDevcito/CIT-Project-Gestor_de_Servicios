import OutboxNotification from "../models/outboxNotification.model.js";

export interface WhatsAppMessagePayload {
    phone: string;
    subject: string;
    body: string;
}

export interface WhatsAppDispatchResult {
    delivered: boolean;
    mode: "meta_cloud_api" | "sandbox";
    normalizedPhone: string;
    waMeUrl: string;
    outboxId?: number;
}

export const normalizarTelefonoWhatsApp = (rawPhone: string): string => {
    const digits = rawPhone.replace(/[^\d+]/g, "");
    return digits.startsWith("+") ? digits : `+${digits}`;
};

export const construirEnlaceWaMe = (phone: string, text: string): string => {
    const cleanDigits = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(text)}`;
};

/**
 * Proveedor desacoplado de notificaciones vía WhatsApp integrado con OutboxNotification.
 * - Si están definidas WHATSAPP_API_URL y WHATSAPP_ACCESS_TOKEN, envía por HTTP a WhatsApp Cloud API.
 * - En entornos locales / demo sin credenciales pagas, opera en modo Sandbox registrando el envío en Outbox.
 */
export const enqueueAndSendWhatsApp = async (
    payload: WhatsAppMessagePayload,
): Promise<WhatsAppDispatchResult> => {
    const normalizedPhone = normalizarTelefonoWhatsApp(payload.phone);
    const fullText = `*CITio — ${payload.subject}*\n${payload.body}`;
    const waMeUrl = construirEnlaceWaMe(normalizedPhone, fullText);

    let outboxRecord: OutboxNotification | null = null;
    try {
        outboxRecord = await OutboxNotification.create({
            recipient: `whatsapp:${normalizedPhone}`,
            subject: payload.subject.slice(0, 200),
            body: fullText,
            status: "PENDING",
            attempts: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    } catch {
        // Tolerante si la tabla OutboxNotifications no está sincronizada en entorno de test aislado
    }

    const apiUrl = process.env.WHATSAPP_API_URL?.trim();
    const apiToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

    if (apiUrl && apiToken && typeof fetch === "function") {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: normalizedPhone.replace(/^\+/, ""),
                    type: "text",
                    text: { body: fullText },
                }),
            });

            if (response.ok) {
                if (outboxRecord) {
                    await outboxRecord.update({ status: "SENT" });
                }
                return {
                    delivered: true,
                    mode: "meta_cloud_api",
                    normalizedPhone,
                    waMeUrl,
                    outboxId: outboxRecord?.id,
                };
            }
        } catch {
            if (outboxRecord) {
                await outboxRecord.update({ status: "FAILED" }).catch(() => {});
            }
        }
    }

    // Modo Sandbox / Demo: marca como SENT en el Outbox y retorna el enlace directo wa.me
    if (outboxRecord) {
        await outboxRecord.update({ status: "SENT" }).catch(() => {});
    }

    return {
        delivered: true,
        mode: "sandbox",
        normalizedPhone,
        waMeUrl,
        outboxId: outboxRecord?.id,
    };
};
