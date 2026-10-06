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

Production deployments outside Vercel forward reservations to
`https://pappare.vercel.app/api/reservations` by default. The Pappare VPS cannot
reach Telegram directly. No `.env` change is required for this default route.
The Vercel deployment accepts the reservation and sends its Telegram notification.
Vercel always sends directly, even if it has a stale relay environment variable.
The VPS must be able to reach `pappare.vercel.app`.

`RESERVATION_RELAY_URL` optionally overrides the destination on the VPS.
Set it to `direct` only on servers with working Telegram connectivity.
Development uses direct delivery by default. A failed relay request is never
retried automatically through another route, avoiding duplicate notifications
when the delivery succeeded but its response was lost.

After pulling this change on the VPS, run `corepack pnpm build`, then only after
a successful build run `pm2 restart pappare --update-env`. Test the form on
`https://pappare.ru` and verify the message in the restaurant's Telegram chat.

Required Vercel environment variables:

- `NOTIFICATION_CHANNEL=telegram`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`

Keep `TELEGRAM_BOT_TOKEN` only in Vercel Settings -> Environment Variables. Do not commit it and do not create `.env.local` for production secrets.

Vercel registers the webhook automatically when it sends a reservation.
This is necessary because callbacks must also use a server with Telegram access.
The webhook secret comes from `TELEGRAM_WEBHOOK_SECRET`, or is derived from the
bot token when that variable is absent. Both registration and validation use
the same secret. Existing pending clicks are preserved.

Webhook URL after deployment:

```text
https://pappare.vercel.app/api/telegram/webhook
```

Set webhook with the required secret:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://pappare.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

After a Vercel deployment, send a clearly marked test reservation through the
site to register the webhook, then verify Called -> Confirmed on one test and
Cancelled on another. Called leaves the final actions available; Confirmed and
Cancelled remove the buttons. The webhook accepts only the configured admin chat.

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
