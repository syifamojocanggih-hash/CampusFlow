import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("mysql://root:password@localhost:3306/campusflow"),
  JWT_SECRET: z.string().min(8).default("campusflow_dev_secret_key_change_in_prod"),
  GEMINI_API_KEY: z.string().optional().default(""),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@campusflow.id"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,https://localhost:5173"),
});

export const env = envSchema.parse(process.env);

export const allowedCorsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

