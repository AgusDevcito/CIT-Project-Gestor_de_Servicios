import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import { Profile, User } from "../models/index.js";
import type { Rol } from "../constants/roles.js";

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: Rol;
  document_url?: string | null;
  document_name?: string | null;
}

export interface CreateProfileData {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

const publicUserAttributes = { exclude: ["password"] };

export const findByUsernameWithProfile = (usernameOrEmail: string) => {
  const clean = usernameOrEmail.trim();
  return User.findOne({
    where: {
      [Op.or]: [
        { username: clean },
        { username: { [Op.iLike]: clean } },
        { email: { [Op.iLike]: clean } },
      ],
    },
    include: { model: Profile, as: "Profile" },
  });
};

export const findByPk = (id: number) => User.findByPk(id);

export const findByEmail = (email: string) => User.findOne({ where: { email } });

export const findAllWithProfile = () =>
  User.findAll({ attributes: publicUserAttributes, include: { model: Profile, as: "Profile" } });

export const findByIdWithProfile = (id: number) =>
  User.findByPk(id, { attributes: publicUserAttributes, include: { model: Profile, as: "Profile" } });

/**
 * Paginated list with optional search (by username or email) and role filter.
 */
export const findAllWithProfilePaginated = async (options: {
  offset?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const where: any = {};
  if (options.search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${options.search}%` } },
      { email: { [Op.iLike]: `%${options.search}%` } },
    ];
  }
  if (options.role) {
    where.role = options.role;
  }
  const result = await User.findAndCountAll({
    where,
    attributes: publicUserAttributes,
    include: { model: Profile, as: "Profile" },
    offset: options.offset,
    limit: options.limit,
    order: [["id", "ASC"]],
  });
  return result;
};

export const create = (data: CreateUserData) => User.create(data);

export const update = (
  user: User,
  data: { username?: string; email?: string; password?: string; role?: Rol; isActive?: boolean }
) => user.update(data);

export const destroy = (user: User) => user.destroy();

export const createUserWithProfile = async (userData: CreateUserData, profileData: CreateProfileData): Promise<User> => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.create(userData, { transaction });
    await Profile.create({ ...profileData, user_id: user.id }, { transaction });
    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
