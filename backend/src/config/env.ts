import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from possible locations
const candidatePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("mysql://root:password@localhost:3306/campusflow"),
  JWT_SECRET: z.string().min(8).default("campusflow_dev_secret_key_change_in_prod"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("campusflow-coach"),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@campusflow.id"),
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:5173,https://localhost:5173,http://localhost:5174,https://localhost:5174,http://127.0.0.1:5174"
    ),
});

export const env = envSchema.parse(process.env);

export const allowedCorsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
