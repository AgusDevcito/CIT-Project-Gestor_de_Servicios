import { notFoundError, validationError } from "../errors/AppError.js";
import { hashPassword } from "../helpers/password.js";
import * as userRepository from "../repositories/user.repository.js";
import { ROL } from "../constants/roles.js";
import type { Rol } from "../constants/roles.js";

export interface CreateUserInput {
    username?: string;
    email?: string;
    password?: string;
    role?: Rol;
}

export interface UpdateUserInput {
    username?: string;
    email?: string;
    password?: string;
    role?: Rol;
}

const assertValidId = (id: number): void => {
    if (!Number.isInteger(id) || id <= 0) {
        throw validationError("El id es invalido o el usuario no existe");
    }
};

const toPublicUser = (user: {
    id: number;
    username: string;
    email: string;
    role: Rol;
}) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
});

export const create = async (input: CreateUserInput) => {
    const { username, email, password, role } = input;

    if (!username || !email || !password) {
        throw validationError("El username,email y password son obligatorios");
    }

    const user = await userRepository.create({
        username,
        email,
        password: await hashPassword(password),
        role: role ?? ROL.USER,
    });

    return toPublicUser(user);
};

export const list = () => userRepository.findAllWithProfile();

export const getById = async (id: number) => {
    assertValidId(id);

    const user = await userRepository.findByIdWithProfile(id);
    if (!user) throw notFoundError("usuario no encontrado");

    return user;
};

export const update = async (id: number, input: UpdateUserInput) => {
    assertValidId(id);

    const user = await userRepository.findByPk(id);
    if (!user) throw notFoundError("id no valido o incorrecto");

    const data: UpdateUserInput = {};
    if (input.username !== undefined) data.username = input.username;
    if (input.email !== undefined) data.email = input.email;
    if (input.role !== undefined) data.role = input.role;
    if (input.password) data.password = await hashPassword(input.password);

    await userRepository.update(user, data);
    return toPublicUser(user);
};

export const remove = async (id: number) => {
    assertValidId(id);

    const user = await userRepository.findByPk(id);
    if (!user) throw notFoundError("Usuario no encontrado");

    const snapshot = toPublicUser(user);
    await userRepository.destroy(user);
    return snapshot;
};
