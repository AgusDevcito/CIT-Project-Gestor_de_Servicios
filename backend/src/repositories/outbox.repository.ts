import OutboxNotification from "../models/outboxNotification.model.js";

export const create = async (data: {
    recipient: string;
    subject: string;
    body: string;
}) => {
    return OutboxNotification.create({
        ...data,
        status: "PENDING",
        attempts: 0,
    } as any);
};

export const findPending = async () => {
    return OutboxNotification.findAll({ where: { status: "PENDING" } });
};

export const markSent = async (id: number) => {
    return OutboxNotification.update({ status: "SENT" }, { where: { id } });
};

export const markFailed = async (id: number) => {
    return OutboxNotification.update({ status: "FAILED" }, { where: { id } });
};
