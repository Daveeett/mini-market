import dotenv from "dotenv";
import { get as env } from "env-var";

dotenv.config();

export interface EnvConfig {
  server: { nodeEnv: string; port: number; frontendBaseUrl: string; };
  database: { host: string; port: number; user: string; pass: string; name: string; ssl: boolean; };
  encryption: { jwtSecret: string; jwtExpiresIn: string; };
  email: { user: string; pass: string; };
  app: { dueSoonDays: number; bankAccountText: string; };
  isDevelopment: boolean;
}

export const config: EnvConfig = {
  server: {
    nodeEnv: env("NODE_ENV").default("development").asEnum(["development", "production", "test"]),
    port: env("PORT").default(3000).asPortNumber(),
    frontendBaseUrl: env("FRONTEND_BASE_URL").default("http://localhost:4200",).asString(),
  },
  database: {
    host: env("DB_HOST").default("localhost").asString(),
    port: env("DB_PORT").default(5432).asPortNumber(),
    user: env("DB_USER").default("postgres").asString(),
    pass: env("DB_PASSWORD").default("postgres").asString(),
    name: env("DB_NAME").default("mini_market_urbano").asString(),
    ssl: env("DB_SSL").default("false").asBoolStrict(),
  },
  encryption: {
    jwtSecret: env("JWT_SECRET").required().asString(),
    jwtExpiresIn: env("JWT_EXPIRES_IN").default("12h").asString(),
  },
  email: {
    user: env("EMAIL_USER").asString() || "",
    pass: env("EMAIL_PASS").asString() || "",
  },
  app: {
    dueSoonDays: env("DUE_SOON_DAYS").default(3).asIntPositive(),
    bankAccountText: env("BANK_ACCOUNT_TEXT").default("").asString(),
  },
  isDevelopment: env("NODE_ENV").asString() === "development"
};
