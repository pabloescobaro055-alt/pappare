import { NextRequest, NextResponse } from "next/server";
import {createHash,timingSafeEqual} from 'node:crypto';
import {readLimitedBody} from '@/lib/request-body';

import { isDatabaseConfigured, updateReservationStatus } from "@/lib/db";
import { telegramWebhookSecret } from "@/lib/telegram-webhook";
import { deliveryErrorCode } from "@/lib/reservation-delivery";
import {
  answerTelegramCallback,
  editTelegramCallbackMessage,
  editTelegramReservationMessage,
  statusLabel,
} from "@/lib/notifications";

export const runtime = "nodejs";

const allowedStatuses = new Set(["called", "confirmed", "cancelled"]);

export async function POST(request: NextRequest) {
  const secret = telegramWebhookSecret();
  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!secret || !headerSecret || !timingSafeEqual(createHash('sha256').update(headerSecret).digest(),createHash('sha256').update(secret).digest())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if(Number(request.headers.get('content-length'))>20000)return NextResponse.json({ok:false},{status:413});
  const raw=await readLimitedBody(request,20000);if(raw===null)return NextResponse.json({ok:false},{status:413});
  let update;try{update=JSON.parse(raw);}catch{return NextResponse.json({ok:false},{status:400});}
  const callback = update?.callback_query;
  const data = String(callback?.data || "");
  const match = data.match(/^reservation:(called|confirmed|cancelled):(\d+)$/);

  if (!callback || !match) {
    return NextResponse.json({ ok: true });
  }

  if (String(callback.message?.chat?.id) !== process.env.TELEGRAM_CHAT_ID?.trim()) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const [, status, id] = match;

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const userId=callback.from?.id;
    if(!Number.isSafeInteger(userId))return NextResponse.json({ok:false},{status:403});
    const allowedIds=(process.env.TELEGRAM_ADMIN_IDS||'').split(',').map(value=>value.trim()).filter(Boolean);
    let permitted=allowedIds.includes(String(userId));
    if(!allowedIds.length){
      const token=process.env.TELEGRAM_BOT_TOKEN;
      const memberResponse=await fetch(`https://api.telegram.org/bot${token}/getChatMember`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,user_id:userId}),signal:AbortSignal.timeout(8000)});
      const member=await memberResponse.json();permitted=memberResponse.ok&&member.ok===true&&['creator','administrator'].includes(member.result?.status);
    }
    if(!permitted){await answerTelegramCallback(callback.id,'Только администратор может менять бронь');return NextResponse.json({ok:true});}
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
      await editTelegramCallbackMessage(messageId, String(callback.message?.text || ""), status, Number(id));
    }

    await answerTelegramCallback(callback.id, statusLabel(status));
  } catch (error) {
    console.error("Telegram callback handling failed", deliveryErrorCode(error));
    try {
      await answerTelegramCallback(callback.id, "Не удалось обновить статус");
    } catch (callbackError) {
      console.error("Telegram callback answer failed", deliveryErrorCode(callbackError));
    }
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
