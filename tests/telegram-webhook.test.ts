import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/telegram/webhook/route";
import { ensureTelegramWebhook, telegramWebhookSecret, TELEGRAM_WEBHOOK_URL } from "../src/lib/telegram-webhook";

test("Telegram reservation buttons", async t => {
  const env = process.env as Record<string, string | undefined>;
  const keys = ["NODE_ENV", "VERCEL", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_WEBHOOK_SECRET", "DATABASE_URL","TELEGRAM_ADMIN_IDS"];
  const saved = Object.fromEntries(keys.map(key => [key, env[key]]));
  const originalFetch = globalThis.fetch;
  const calls: { method: string; body: any }[] = [];
  function request(status = "called", secret = telegramWebhookSecret(), chat = "-100123") {
    return new NextRequest(TELEGRAM_WEBHOOK_URL, {
      method: "POST", headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret || "" },
      body: JSON.stringify({ callback_query: { from:{id:12345}, id: "callback-test", data: `reservation:${status}:123`, message: { message_id: 456, chat: { id: chat }, text: "🍽 Новая бронь #123\nИмя: Тест" } } }),
    });
  }
  try {
    for (const key of keys) delete env[key];
    env.NODE_ENV = "production";
    env.VERCEL = "1";
    env.TELEGRAM_BOT_TOKEN = "test-token";
    env.TELEGRAM_CHAT_ID = "-100123";
    globalThis.fetch = async (url, init) => {
      if(String(url).endsWith("/getChatMember"))return Response.json({ok:true,result:{status:"administrator"}});
      calls.push({ method: String(url).split("/").pop()!, body: JSON.parse(String(init?.body)) });
      return Response.json({ ok: true });
    };

    await t.test("webhook points to Vercel with matching secret and keeps pending clicks", async () => {
      await ensureTelegramWebhook();
      const call = calls.pop()!;
      assert.equal(call.method, "setWebhook");
      assert.equal(call.body.url, TELEGRAM_WEBHOOK_URL);
      assert.equal(call.body.secret_token, telegramWebhookSecret());
      assert.equal(call.body.drop_pending_updates, false);
      assert.deepEqual(call.body.allowed_updates, ["callback_query"]);
      await ensureTelegramWebhook();
      assert.equal(calls.length, 0);
    });

    await t.test("invalid secret and unrelated chat cannot change a reservation", async () => {
      assert.equal((await POST(request("called", "wrong"))).status, 401);
      assert.equal((await POST(request("called", telegramWebhookSecret(), "wrong"))).status, 403);
      assert.equal(calls.length, 0);
    });

    await t.test("called updates text and leaves confirm/cancel buttons", async () => {
      assert.equal((await POST(request())).status, 200);
      const edit = calls.find(call => call.method === "editMessageText")!;
      assert.match(edit.body.text, /Клиенту позвонили/);
      assert.deepEqual(edit.body.reply_markup.inline_keyboard.flat().map((b: any) => b.callback_data), ["reservation:confirmed:123", "reservation:cancelled:123"]);
      assert.equal(calls.at(-1)!.method, "answerCallbackQuery");
      calls.length = 0;
    });

    for (const [status, label] of [["confirmed", "Бронь подтверждена"], ["cancelled", "Бронь отменена"]]) {
      await t.test(`${status} changes the status and removes completed buttons`, async () => {
        assert.equal((await POST(request(status))).status, 200);
        assert.ok(calls[0].body.text.includes(label));
        assert.deepEqual(calls[0].body.reply_markup.inline_keyboard, []);
        assert.equal(calls[1].method, "answerCallbackQuery");
        calls.length = 0;
      });
    }

    await t.test("repeated callback remains successful when text is already updated", async () => {
      globalThis.fetch = async url => String(url).endsWith("/getChatMember")?Response.json({ok:true,result:{status:"administrator"}}):String(url).endsWith("/editMessageText")
        ? Response.json({ ok: false, description: "Bad Request: message is not modified" }, { status: 400 })
        : Response.json({ ok: true });
      assert.equal((await POST(request())).status, 200);
    });

    await t.test("non-admin chat participant cannot edit reservations",async()=>{
      env.TELEGRAM_ADMIN_IDS='999999';globalThis.fetch=async(url,init)=>{calls.push({method:String(url).split('/').pop()!,body:JSON.parse(String(init?.body))});return Response.json({ok:true});};
      assert.equal((await POST(request())).status,200);assert.equal(calls.some(c=>c.method==='editMessageText'),false);assert.equal(calls.at(-1)?.method,'answerCallbackQuery');calls.length=0;delete env.TELEGRAM_ADMIN_IDS;
    });
    await t.test("network failure is not acknowledged as successful", async () => {
      globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
      assert.equal((await POST(request())).status, 503);
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (saved[key] === undefined) delete env[key]; else env[key] = saved[key];
    }
  }
});
