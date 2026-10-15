import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


export const verifyToken =
(token) => jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRECT);


export const signToken = (user) => {
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRECT;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: "1h" }
    );
};

