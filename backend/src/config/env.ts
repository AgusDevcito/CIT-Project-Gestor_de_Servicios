import dotenv from "dotenv";

dotenv.config();

const requiredVariables = ["DB_NAME", "DB_USER", "DB_HOST"] as const;

const toBool = (value: string | undefined): boolean => value === "true";

const parseCorsOrigins = (value: string | undefined): string[] =>
    value
        ? value.split(",").map((origin) => origin.trim()).filter(Boolean)
        : [];

export interface DatabaseConfig {
    readonly name: string;
    readonly user: string;
    readonly password: string;
    readonly host: string;
    readonly port: number;
    readonly dialect: string;
    readonly ssl: boolean;
    readonly sync: boolean;
}

export interface AppEnv {
    readonly nodeEnv: string;
    readonly isProduction: boolean;
    readonly isTest: boolean;
    readonly port: number;
    readonly corsOrigins: string[];
    readonly jwtSecret: string;
    readonly jwtExpiresIn: string;
    readonly db: DatabaseConfig;
}

export const env: AppEnv = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
    port: Number(process.env.PORT ?? 3000),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    jwtSecret: process.env.JWT_SECRET ?? "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    db: {
        name: process.env.DB_NAME ?? "",
        user: process.env.DB_USER ?? "",
        password: String(process.env.DB_PASSWORD ?? ""),
        host: process.env.DB_HOST ?? "",
        port: Number(process.env.DB_PORT ?? 5432),
        dialect: process.env.DB_DIALECT ?? "postgres",
        ssl: toBool(process.env.DB_SSL),
        sync: toBool(process.env.DB_SYNC),
    },
};

export const assertEnvironment = (): void => {
    const missing: string[] = requiredVariables.filter((key) => !process.env[key]);

    if (!env.jwtSecret) {
        missing.push("JWT_SECRET");
    }

    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
    }
};
