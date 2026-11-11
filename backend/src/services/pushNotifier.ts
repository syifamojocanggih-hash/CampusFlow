import webpush from "web-push";
import { env } from "../config/env.ts";

let vapidConfigured = false;

export function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

export async function sendInterventionPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: boolean; reason?: string }> {
  if (!ensureVapidConfigured()) {
    return {
      sent: false,
      reason: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum dikonfigurasi di backend/.env",
    };
  }

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/focus",
    })
  );
  return { sent: true };
}
