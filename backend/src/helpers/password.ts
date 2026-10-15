import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (plain: string): Promise<string> => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plain, salt);
};

export const comparePasswords = (plain: string, hash: string): Promise<boolean> =>
    bcrypt.compare(plain, hash);
