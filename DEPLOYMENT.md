# Pappare Italiano: deployment and integrations

## Reservation Architecture

The reservation form posts to `POST /api/reservations`.

Server flow:

1. Validate name, phone and guests.
2. Apply spam protection:
   - hidden honeypot field;
   - minimum form-fill time;
   - per-IP rate limit.
3. If `DATABASE_URL` is configured, save the reservation to the `reservations` table.
4. If `DATABASE_URL` is not configured, create a short fallback reservation number and continue in Telegram-only mode.
5. Send a Telegram message with inline buttons.
6. Telegram webhook receives button clicks and edits the original Telegram message. With a database it also updates reservation status in the table.
7. Return the user message:
   `Спасибо! Мы получили вашу заявку и свяжемся с вами для подтверждения бронирования.`

## Database

Booking works without PostgreSQL. Add `DATABASE_URL` only if reservation history and database-backed statuses are needed.

Optional environment variable:

- `DATABASE_URL`

The SQL migration is available in `db/reservations.sql`.

## Telegram

Required Vercel environment variables:

- `NOTIFICATION_CHANNEL=telegram`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`

Keep `TELEGRAM_BOT_TOKEN` only in Vercel Settings -> Environment Variables. Do not commit it and do not create `.env.local` for production secrets.

Webhook URL after deployment:

```text
https://pappare.ru/api/telegram/webhook
```

Set webhook with the required secret:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://pappare.ru/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

## MAX

MAX is prepared as an adapter and can be enabled later:

- `NOTIFICATION_CHANNEL=max` or `both`
- `MAX_API_ENDPOINT`
- `MAX_BOT_TOKEN`
- `MAX_RECIPIENT_ID`

## Content Editing

Editable content is grouped in `src/data`:

- `src/data/menu.ts` - restaurant menu, bar, kids menu, lunch offer.
- `src/data/site.ts` - contacts, social links, events, team placeholders.
- `src/data/reviews.ts` - reviews seed data, ready for manual JSON/API replacement.

## Vercel Deployment

1. Import the project into Vercel.
2. Set environment variables from `.env.example`.
3. Build command: `pnpm build`.
4. Output: Next.js default.
5. Production domain: `https://pappare.ru`.
