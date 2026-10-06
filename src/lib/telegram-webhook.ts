import { createHmac } from "node:crypto";

export const TELEGRAM_WEBHOOK_URL = "https://pappare.vercel.app/api/telegram/webhook";
let registration: Promise<void> | undefined;

export function telegramWebhookSecret() {
  const configured = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (configured) return configured;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token
    ? createHmac("sha256", token).update("pappare-telegram-webhook").digest("hex")
    : undefined;
}

// Register from the server that can reach Telegram. Cache successful setup for
// this process; retry on the next reservation if Telegram was unavailable.
export async function ensureTelegramWebhook() {
  if (process.env.VERCEL !== "1" || process.env.NODE_ENV !== "production") return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = telegramWebhookSecret();
  if (!token || !secret) throw new Error("Telegram configuration missing");
  if (!registration) {
    registration = (async () => {
      const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: TELEGRAM_WEBHOOK_URL,
          secret_token: secret,
          allowed_updates: ["callback_query"],
          drop_pending_updates: false,
        }),
        signal: AbortSignal.timeout(4000),
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error("Telegram webhook registration failed");
    })();
  }
  try {
    await registration;
  } catch (error) {
    registration = undefined;
    throw error;
  }
}
