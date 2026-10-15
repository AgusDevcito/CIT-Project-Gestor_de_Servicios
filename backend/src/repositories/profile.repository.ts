import { Profile, User } from "../models/index.js";

const userInclude = {
    model: User,
    as: "User",
    attributes: { exclude: ["password"] },
};

export const findAllWithUser = () => Profile.findAll({ include: userInclude });

export const findByUserIdWithUser = (userId: number) =>
    Profile.findOne({ where: { user_id: userId }, include: userInclude });

export const findByUserId = (userId: number) =>
    Profile.findOne({ where: { user_id: userId } });

export const update = (
    profile: Profile,
    data: { first_name?: string; last_name?: string; avatar_url?: string | null },
) => profile.update(data);
