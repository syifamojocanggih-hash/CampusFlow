import { createApp } from "./app.ts";
import { env } from "./config/env.ts";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[CampusFlow Backend] API berjalan di http://localhost:${env.PORT}/api/v1`);
});

