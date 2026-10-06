import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/reservations/route";
import { DEFAULT_RESERVATION_RELAY, reservationRelayUrl } from "../src/lib/reservation-delivery";

test("reservation delivery", async (t) => {
  const keys = ["NODE_ENV", "VERCEL", "RESERVATION_RELAY_URL", "DATABASE_URL", "NOTIFICATION_CHANNEL", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
  const env = process.env as Record<string, string | undefined>;
  const saved = Object.fromEntries(keys.map(key => [key, env[key]]));
  const originalFetch = globalThis.fetch;
  let ip = 0;
  function request(headers = {}) {
    return new NextRequest("https://pappare.ru/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `test-${++ip}`, ...headers },
      body: JSON.stringify({ name: "ТЕСТ", phone: "+70000000000", guests: 2, time: "19:00", company: "", submittedAt: Date.now() - 10000 }),
    });
  }
  try {
    for (const key of keys) delete env[key];
    env.NODE_ENV = "production";
    env.TELEGRAM_BOT_TOKEN = "test-token";
    env.TELEGRAM_CHAT_ID = "test-chat";

    await t.test("VPS without env override relays and preserves the reservation", async () => {
      let count = 0;
      globalThis.fetch = async (url, init) => {
        count++;
        assert.equal(url, DEFAULT_RESERVATION_RELAY);
        assert.equal(new Headers(init?.headers).get("x-pappare-relay-hop"), "1");
        assert.equal(JSON.parse(String(init?.body)).name, "ТЕСТ");
        return Response.json({ ok: true });
      };
      const response = await POST(request());
      assert.equal(response.status, 200);
      assert.equal((await response.json()).ok, true);
      assert.equal(count, 1);
    });

    await t.test("relay failure cannot become success or cause a second send", async () => {
      let count = 0;
      globalThis.fetch = async () => { count++; throw new TypeError("fetch failed"); };
      const response = await POST(request());
      assert.equal(response.status, 502);
      assert.equal((await response.json()).ok, false);
      assert.equal(count, 1);
    });

    await t.test("relay HTML error is handled without a crash", async () => {
      globalThis.fetch = async () => new Response("unavailable", { status: 503 });
      const response = await POST(request());
      assert.equal(response.status, 503);
      assert.equal((await response.json()).ok, false);
    });

    await t.test("relay loops stop before another network call", async () => {
      globalThis.fetch = async () => { assert.fail("unexpected recursive send"); };
      assert.equal((await POST(request({ "x-pappare-relay-hop": "1" }))).status, 502);
    });

    await t.test("Vercel always delivers directly, even with a stale relay setting", async () => {
      env.VERCEL = "1";
      env.RESERVATION_RELAY_URL = DEFAULT_RESERVATION_RELAY;
      globalThis.fetch = async (url, init) => {
        if (String(url).endsWith("/setWebhook")) return Response.json({ ok: true });
        assert.equal(url, "https://api.telegram.org/bottest-token/sendMessage");
        assert.ok(init?.signal);
        return Response.json({ ok: true, result: { message_id: 123 } });
      };
      assert.equal((await POST(request({ "x-pappare-relay-hop": "1" }))).status, 200);
    });

    await t.test("Telegram timeout returns JSON failure instead of unhandled 500", async () => {
      globalThis.fetch = async () => { throw new TypeError("fetch failed", { cause: { code: "ETIMEDOUT" } }); };
      const response = await POST(request());
      assert.equal(response.status, 500);
      assert.equal((await response.json()).ok, false);
    });

    await t.test("Telegram rejection is not reported as delivered", async () => {
      globalThis.fetch = async () => Response.json({ ok: false });
      assert.equal((await POST(request())).status, 500);
    });

    await t.test("development stays local and explicit direct mode is supported", () => {
      assert.equal(reservationRelayUrl({ NODE_ENV: "development" }), undefined);
      assert.equal(reservationRelayUrl({ NODE_ENV: "production", RESERVATION_RELAY_URL: "direct" }), undefined);
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (saved[key] === undefined) delete env[key];
      else env[key] = saved[key];
    }
  }
});
