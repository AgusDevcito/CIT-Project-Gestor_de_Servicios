import { Op } from "sequelize";
import CitApplication from "../models/citApplication.model.js";
import type { CitApplicationStatus } from "../models/citApplication.model.js";

export interface CreateCitApplicationInput {
    first_name: string;
    last_name: string;
    dni: string;
    email: string;
    dni_front_path: string;
    dni_back_path: string;
}

export const create = (data: CreateCitApplicationInput) =>
    // Cast to any because Sequelize will fill default fields (status, timestamps)
    CitApplication.create(data as any);

export const findById = (id: number) => CitApplication.findByPk(id);

export const findAll = (where: any = {}) => CitApplication.findAll({ where, order: [["createdAt", "DESC"]] });

export const findPendingByDni = (dni: string) =>
    CitApplication.findOne({ where: { dni, status: "PENDING" as CitApplicationStatus } });

export const update = (app: any, data: Partial<CreateCitApplicationInput & { status?: CitApplicationStatus; reviewed_by?: number; reviewed_at?: Date; rejection_reason?: string }>) => app.update(data);
