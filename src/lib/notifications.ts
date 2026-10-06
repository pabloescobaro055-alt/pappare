import { deliveryErrorCode } from "@/lib/reservation-delivery";

export type ReservationPayload = {
  id?: number;
  name: string;
  phone: string;
  time?: string;
  date?: string;
  guests?: number;
  comment?: string;
  status?: string;
};

export async function sendTelegramText(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return false;
  return Boolean((await response.json()).ok);
}

export type NotificationResult = {
  channel: "telegram" | "max";
  ok: boolean;
  error?: string;
};

const emptyTelegramKeyboard = { inline_keyboard: [] };

const telegramButtons = (id?: number) => ({
  inline_keyboard: [
    [
      { text: "📞 Позвонили", callback_data: `reservation:called:${id}` },
      { text: "✅ Подтвердить", callback_data: `reservation:confirmed:${id}` },
    ],
    [{ text: "❌ Отменить", callback_data: `reservation:cancelled:${id}` }],
  ],
});

function statusSuffix(status: string) {
  return `\n\nСтатус: ${statusLabel(status)}`;
}

function withStatus(text: string, status: string) {
  const statusIndex = text.lastIndexOf("\n\nСтатус:");
  const baseText = statusIndex >= 0 ? text.slice(0, statusIndex) : text;
  return `${baseText}${statusSuffix(status)}`;
}

export function parsePreferredTime(value = "") {
  const trimmed = value.trim();
  const timeMatch = trimmed.match(/([01]?\d|2[0-3])[:.][0-5]\d/);
  const time = timeMatch?.[0]?.replace(".", ":") || trimmed || "не указано";
  const date = timeMatch
    ? trimmed.replace(timeMatch[0], "").replace(/[,.;-]+$/, "").trim()
    : "";

  return {
    date: date || "не указана",
    time,
  };
}

export function statusLabel(status = "new") {
  const labels: Record<string, string> = {
    new: "Новая бронь",
    called: "Клиенту позвонили",
    confirmed: "Бронь подтверждена",
    cancelled: "Бронь отменена",
  };

  return labels[status] || status;
}

export function formatReservation(payload: ReservationPayload) {
  const parsed = parsePreferredTime(payload.time);
  const date = payload.date || parsed.date;
  const time = parsed.time;
  const id = payload.id ? `#${payload.id}` : "";
  const status = payload.status && payload.status !== "new" ? statusSuffix(payload.status) : "";

  const lines = [
    `🍽 Новая бронь ${id}`.trim(),
    "",
    `Имя: ${payload.name}`,
    `Телефон: ${payload.phone}`,
    `Дата: ${date}`,
    `Время: ${time}`,
    `Гостей: ${payload.guests || "не указано"}`,
    "",
    "Комментарий:",
    payload.comment || "—",
  ];

  return `${lines.join("\n")}${status}`;
}

export async function sendTelegramReservation(
  payload: ReservationPayload,
): Promise<NotificationResult & { messageId?: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      channel: "telegram",
      ok: false,
      error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured",
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatReservation(payload),
        disable_web_page_preview: true,
        reply_markup: telegramButtons(payload.id),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        channel: "telegram",
        ok: false,
        error: `Telegram HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return { channel: "telegram", ok: data.ok === true, messageId: data.result?.message_id };
  } catch (error) {
    return { channel: "telegram", ok: false, error: deliveryErrorCode(error) };
  }
}

export async function sendMaxReservation(
  payload: ReservationPayload,
): Promise<NotificationResult> {
  const endpoint = process.env.MAX_API_ENDPOINT;
  const token = process.env.MAX_BOT_TOKEN;
  const recipient = process.env.MAX_RECIPIENT_ID;

  if (!endpoint || !token || !recipient) {
    return {
      channel: "max",
      ok: false,
      error: "MAX_API_ENDPOINT, MAX_BOT_TOKEN or MAX_RECIPIENT_ID is not configured",
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipient,
      text: formatReservation(payload),
    }),
  });

  if (!response.ok) {
    return {
      channel: "max",
      ok: false,
      error: await response.text(),
    };
  }

  return { channel: "max", ok: true };
}

export async function editTelegramReservationMessage(
  payload: ReservationPayload & { messageId: number },
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram credentials are not configured");
  }

  const isProcessed = Boolean(payload.status && payload.status !== "new");
  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: payload.messageId,
      text: formatReservation(payload),
      reply_markup: isProcessed ? emptyTelegramKeyboard : telegramButtons(payload.id),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function editTelegramCallbackMessage(messageId: number, text: string, status: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram credentials are not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: withStatus(text, status),
      reply_markup: emptyTelegramKeyboard,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function answerTelegramCallback(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("Telegram token is not configured");
  }

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}
