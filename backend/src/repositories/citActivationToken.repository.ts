import CitActivationToken from "../models/citActivationToken.model.js";
import type { CitActivationToken as TokenAttrs } from "../models/citActivationToken.model.js";
import { Op } from "sequelize";

export const create = async (data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
}) => {
    return CitActivationToken.create({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
    } as any);
};

export const findByHash = async (hash: string) => {
    return CitActivationToken.findOne({ where: { token_hash: hash } });
};

export const findValidByUser = async (userId: number) => {
    return CitActivationToken.findOne({
        where: {
            user_id: userId,
            used_at: null,
            expires_at: { [Op.gt]: new Date() },
        },
    });
};

export const findByPlainToken = async (plain: string) => {
    // We need to compare using bcrypt, not direct hash match – handled in service
    return CitActivationToken.findAll({ where: { used_at: null } }); // fetch candidates for verification
};

export const markUsed = async (tokenRecord: TokenAttrs) => {
    tokenRecord.used_at = new Date();
    return tokenRecord.save();
};
