import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { prisma } from "./lib/prisma.ts";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[CampusFlow Backend] API berjalan di http://localhost:${env.PORT}/api/v1`);
});

async function shutdown(signal: string) {
  console.log(`[CampusFlow Backend] Menerima ${signal}, menutup server dengan aman...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
