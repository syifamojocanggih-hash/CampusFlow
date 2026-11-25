import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { prisma } from "./lib/prisma.ts";

const app = createApp();
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(env.PORT, HOST, () => {
  console.log(
    `[CampusFlow Backend] API berjalan di http://localhost:${env.PORT}/api/v1 (bind ${HOST}, OS: ${process.platform})`
  );
});

let isShuttingDown = false;
async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[CampusFlow Backend] Menerima ${signal}, menutup server dengan aman...`);
  const forceExitTimer = setTimeout(() => {
    process.exit(0);
  }, 4000);
  forceExitTimer.unref();

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
