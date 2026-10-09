import { NextRequest, NextResponse } from "next/server";
import {isIP} from "node:net";
import {randomInt,createHash} from "node:crypto";
import {readLimitedBody} from '@/lib/request-body';
import {ReservationSecurityError,requestIp,formToken,verifyFormToken,relayHeaders,verifyRelay,guardReservation,limitAttempts} from "@/lib/reservation-security";

import { createReservation, isDatabaseConfigured, setTelegramMessageId } from "@/lib/db";
import { deliveryErrorCode, reservationRelayUrl } from "@/lib/reservation-delivery";
import {
  ReservationPayload,
  sendMaxReservation,
  sendTelegramReservation,
} from "@/lib/notifications";

export const runtime = "nodejs";

function clean(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function validPhone(phone: string) {
  const digits=phone.replace(/\D/g,'');return /^[+\d\s\-()]{10,24}$/.test(phone)&&/^[78]\d{10}$/.test(digits)&&!/(\d)\1{5}/.test(digits);
}

function parseGuests(value: unknown) {
  const guests = Number(value);
  return Number.isInteger(guests) ? guests : undefined;
}

function createFallbackReservation(payload: ReservationPayload): ReservationPayload & { id: number } {
  const shortTimestamp = randomInt(100000000000,999999999999);
  return {
    ...payload,
    id: shortTimestamp,
    status: "new",
  };
}

export async function GET(request:NextRequest){
  if(process.env.VERCEL==='1')return NextResponse.json({ok:false},{status:403,headers:{'X-Pappare-Reservation-Security':'v1'}});
  if(limitAttempts(requestIp(request)))return NextResponse.json({ok:false,message:'Слишком частые запросы. Попробуйте позже.'},{status:429});
  try{const token=formToken();const response=NextResponse.json({token},{headers:{'Cache-Control':'no-store'}});response.cookies.set('pappare-reservation',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/reservations',maxAge:1800});return response;}catch(e){return NextResponse.json({ok:false,message:(e as Error).message},{status:503});}
}
export async function POST(request:NextRequest){
 try{const response=await handlePost(request);if(response.status>=400)console.warn('reservation_rejected',JSON.stringify({ip:requestIp(request),status:response.status,at:new Date().toISOString()}));return response;}catch(e){if(e instanceof ReservationSecurityError){console.warn('reservation_rejected',JSON.stringify({ip:requestIp(request),status:e.status,at:new Date().toISOString()}));return NextResponse.json({ok:false,message:e.message},{status:e.status,headers:e.status===429?{'Retry-After':'60'}:{}});}console.error('Reservation security check failed');return NextResponse.json({ok:false,message:'Не удалось проверить заявку. Позвоните в ресторан.'},{status:503});}
}
async function handlePost(request: NextRequest) {
  let ip = requestIp(request);

  if (process.env.VERCEL!=='1'&&limitAttempts(ip)) {
    return NextResponse.json(
      { ok: false, message: "Слишком много заявок. Попробуйте позже." },
      { status: 429 },
    );
  }

  if(Number(request.headers.get('content-length'))>5000)return NextResponse.json({ok:false},{status:413});
  const raw=await readLimitedBody(request,5000);if(raw===null)return NextResponse.json({ok:false},{status:413});
  const relayed=process.env.VERCEL==='1';
  if(relayed&&!verifyRelay(request,raw))return NextResponse.json({ok:false,message:'Нет доступа к доставке заявок'},{status:401});
  if(!relayed){const origin=request.headers.get('origin');const allowedOrigins=process.env.NODE_ENV==='production'?['https://pappare.ru','https://www.pappare.ru',process.env.CINEMA_PUBLIC_ORIGIN].filter(Boolean):[request.nextUrl.origin];if(!origin||!allowedOrigins.includes(origin)||request.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({ok:false},{status:403});if(request.headers.has('x-pappare-relay-hop'))return NextResponse.json({ok:false},{status:403});}
  if(!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({ok:false},{status:415});
  let body;try{body=JSON.parse(raw);}catch{return NextResponse.json({ok:false},{status:400});}
  if(relayed&&typeof body?.clientIp==='string'&&isIP(body.clientIp))ip=body.clientIp;

  if (!body || typeof body!=='object'||Array.isArray(body)||clean(body.company)) {
    return NextResponse.json({ ok: false, message: "Некорректная заявка." }, { status: 400 });
  }

  if(!relayed&&!verifyFormToken(body.formToken,request.cookies.get('pappare-reservation')?.value))return NextResponse.json({ok:false,message:'Обновите форму и повторите отправку.'},{status:403});
  const submittedAt = Number(body.submittedAt);
  if (!Number.isFinite(submittedAt) || Date.now() - submittedAt < 2500) {
    return NextResponse.json(
      { ok: false, message: "Попробуйте отправить форму еще раз." },
      { status: 400 },
    );
  }

  const payload: ReservationPayload = {
    name: clean(body.name, 80),
    phone: clean(body.phone, 32),
    time: clean(body.time, 80),
    guests: parseGuests(body.guests),
    comment: clean(body.comment, 500),
  };

  if ((payload.name.match(/\p{L}/gu)||[]).length<2||!/^[\p{L}\p{M} .’'\-]+$/u.test(payload.name)||!payload.phone||!validPhone(payload.phone)) {
    return NextResponse.json(
      { ok: false, message: "Укажите имя и корректный телефон." },
      { status: 400 },
    );
  }

  if (body.guests!==undefined&&body.guests!==null&&body.guests!==''&&(!payload.guests||payload.guests<1||payload.guests>30)) {
    return NextResponse.json(
      { ok: false, message: "Укажите корректное количество гостей." },
      { status: 400 },
    );
  }

  if(payload.time&&!/(^|[^\d])([01]?\d|2[0-3])[:.][0-5]\d(?!\d)/.test(payload.time))return NextResponse.json({ok:false,message:'Укажите время, например 19:00.'},{status:400});
  if(String(body.name||'').length>80||String(body.time||'').length>80||String(body.comment||'').length>500)return NextResponse.json({ok:false,message:'Проверьте длину полей.'},{status:400});
  const digits=payload.phone.replace(/\D/g,'');payload.phone='+7'+digits.slice(1);
  const requestId=relayed?createHash('sha256').update(raw).digest('hex'):createHash('sha256').update(String(body.formToken)).digest('hex');
  await guardReservation(ip,payload.phone,payload.time||'',requestId);
  // A relay can deliver notifications when the web server cannot reach Telegram directly.
  const relayUrl = reservationRelayUrl();
  if (relayUrl) {
    try {
      if (request.headers.has("x-pappare-relay-hop")) {
        throw new Error("Reservation relay loop");
      }
      const relayBody=JSON.stringify({ ...payload, company: '', submittedAt,requestId,clientIp:ip });
      const relayResponse = await fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ip,
          ...relayHeaders(relayBody),
        },
        body: relayBody,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const relayResult = (await relayResponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (relayResponse.ok && relayResult?.ok) {
        return NextResponse.json({
          ok: true,
          message: "Спасибо! Мы получили вашу заявку и свяжемся с вами для подтверждения бронирования.",
        });
      }

      console.error("Reservation relay failed", relayResponse.status);
      return NextResponse.json(
        {
          ok: false,
          message: relayResult?.message || "Не удалось отправить заявку. Пожалуйста, позвоните нам.",
        },
        { status: relayResponse.status >= 400 ? relayResponse.status : 502 },
      );
    } catch (error) {
      console.error("Reservation relay request failed", deliveryErrorCode(error));
      return NextResponse.json(
        { ok: false, message: "Не удалось отправить заявку. Пожалуйста, позвоните нам." },
        { status: 502 },
      );
    }
  }

  let reservation: ReservationPayload & { id?: number };

  if (isDatabaseConfigured()) {
    try {
      reservation = await createReservation(payload);
    } catch (error) {
      console.error("Reservation DB insert failed", error);
      return NextResponse.json(
        {
          ok: false,
          message: "Не удалось сохранить заявку. Пожалуйста, позвоните нам.",
        },
        { status: 500 },
      );
    }
  } else {
    reservation = createFallbackReservation(payload);
  }

  const channel = process.env.NOTIFICATION_CHANNEL || "telegram";
  const results = [];

  if (channel === "telegram" || channel === "both") {
    const result = await sendTelegramReservation(reservation);
    results.push(result);

    if (isDatabaseConfigured() && reservation.id && result.ok && result.messageId) {
      try {
        await setTelegramMessageId(reservation.id, result.messageId);
      } catch (error) {
        // The notification was already delivered: do not invite a duplicate submission.
        console.error("Reservation message ID save failed", deliveryErrorCode(error));
      }
    }
  }

  if (channel === "max" || channel === "both") {
    results.push(await sendMaxReservation(reservation));
  }

  const delivered = results.some((result) => result.ok);

  if (!delivered) {
    console.error("Reservation notification failed", results);
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось отправить заявку. Пожалуйста, позвоните нам.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Спасибо! Мы получили вашу заявку и свяжемся с вами для подтверждения бронирования.",
  });
}
