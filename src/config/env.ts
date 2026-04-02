import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_ISSUER: z.string().default("zorvyn-finance"),
  JWT_AUDIENCE: z.string().default("zorvyn-finance"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export const env = EnvSchema.parse(process.env);

