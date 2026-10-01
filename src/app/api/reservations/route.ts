import { NextRequest, NextResponse } from "next/server";

import { createReservation, isDatabaseConfigured, setTelegramMessageId } from "@/lib/db";
import {
  ReservationPayload,
  sendMaxReservation,
  sendTelegramReservation,
} from "@/lib/notifications";

export const runtime = "nodejs";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = rateLimit.get(ip);

  if (!current || current.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function clean(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function validPhone(phone: string) {
  return /^[+\d\s\-()]{7,24}$/.test(phone);
}

function parseGuests(value: unknown) {
  const guests = Number(value);
  return Number.isInteger(guests) ? guests : undefined;
}

function createFallbackReservation(payload: ReservationPayload): ReservationPayload & { id: number } {
  const shortTimestamp = Math.floor(Date.now() / 1000) % 1000000;
  return {
    ...payload,
    id: shortTimestamp,
    status: "new",
  };
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "Слишком много заявок. Попробуйте позже." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || clean(body.company)) {
    return NextResponse.json({ ok: false, message: "Некорректная заявка." }, { status: 400 });
  }

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

  if (!payload.name || !payload.phone || !validPhone(payload.phone)) {
    return NextResponse.json(
      { ok: false, message: "Укажите имя и корректный телефон." },
      { status: 400 },
    );
  }

  if (payload.guests && (payload.guests < 1 || payload.guests > 30)) {
    return NextResponse.json(
      { ok: false, message: "Укажите корректное количество гостей." },
      { status: 400 },
    );
  }

  // A relay can deliver notifications when the web server cannot reach Telegram directly.
  const relayUrl = process.env.RESERVATION_RELAY_URL?.trim();
  if (relayUrl) {
    try {
      const relayResponse = await fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ip,
        },
        body: JSON.stringify({ ...payload, company: "", submittedAt }),
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

      console.error("Reservation relay failed", relayResponse.status, relayResult?.message);
      return NextResponse.json(
        {
          ok: false,
          message: relayResult?.message || "Не удалось отправить заявку. Пожалуйста, позвоните нам.",
        },
        { status: relayResponse.status >= 400 ? relayResponse.status : 502 },
      );
    } catch (error) {
      console.error("Reservation relay request failed", error);
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
      await setTelegramMessageId(reservation.id, result.messageId);
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
