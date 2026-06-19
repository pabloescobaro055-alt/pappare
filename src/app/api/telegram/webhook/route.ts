import { NextRequest, NextResponse } from "next/server";

import { isDatabaseConfigured, updateReservationStatus } from "@/lib/db";
import {
  answerTelegramCallback,
  editTelegramCallbackMessage,
  editTelegramReservationMessage,
  statusLabel,
} from "@/lib/notifications";

export const runtime = "nodejs";

const allowedStatuses = new Set(["called", "confirmed", "cancelled"]);

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const callback = update?.callback_query;
  const data = String(callback?.data || "");
  const match = data.match(/^reservation:(called|confirmed|cancelled):(\d+)$/);

  if (!callback || !match) {
    return NextResponse.json({ ok: true });
  }

  const [, status, id] = match;

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: true });
  }

  const messageId = Number(callback.message?.message_id);

  if (isDatabaseConfigured()) {
    const reservation = await updateReservationStatus(Number(id), status);
    const storedMessageId = Number(callback.message?.message_id || reservation.messageId);

    if (storedMessageId) {
      await editTelegramReservationMessage({
        ...reservation,
        status,
        messageId: storedMessageId,
      });
    }
  } else if (messageId) {
    await editTelegramCallbackMessage(
      messageId,
      String(callback.message?.text || ""),
      status,
      Number(id),
    );
  }

  await answerTelegramCallback(callback.id, `Статус: ${statusLabel(status)}`);

  return NextResponse.json({ ok: true });
}
