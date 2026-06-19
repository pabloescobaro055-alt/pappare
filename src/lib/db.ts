import { parsePreferredTime, ReservationPayload } from "@/lib/notifications";

type QueryResult<T> = {
  rows: T[];
};

type PgClient = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
};

let clientPromise: Promise<PgClient> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

async function getClient(): Promise<PgClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const dynamicImport = new Function("specifier", "return import(specifier)") as (
        specifier: string,
      ) => Promise<{ Pool: new (config: Record<string, unknown>) => PgClient }>;
      const { Pool } = await dynamicImport("pg");
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      });
    })();
  }

  return clientPromise;
}

export async function ensureReservationsTable() {
  const client = await getClient();
  await client.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      reservation_date TEXT,
      reservation_time TEXT,
      preferred_time TEXT,
      guests INTEGER,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      telegram_message_id BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export type ReservationRecord = ReservationPayload & {
  id: number;
  messageId?: number;
};

function toReservationPayload(row: Record<string, unknown>): ReservationRecord {
  return {
    id: Number(row.id),
    name: String(row.name || ""),
    phone: String(row.phone || ""),
    date: String(row.reservation_date || ""),
    time: String(row.preferred_time || row.reservation_time || ""),
    guests: row.guests ? Number(row.guests) : undefined,
    comment: row.comment ? String(row.comment) : "",
    status: String(row.status || "new"),
    messageId: row.telegram_message_id ? Number(row.telegram_message_id) : undefined,
  };
}

export async function createReservation(payload: ReservationPayload) {
  await ensureReservationsTable();
  const client = await getClient();
  const parsed = parsePreferredTime(payload.time);
  const result = await client.query<Record<string, unknown>>(
    `
      INSERT INTO reservations (
        name, phone, reservation_date, reservation_time, preferred_time, guests, comment, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
      RETURNING *
    `,
    [
      payload.name,
      payload.phone,
      payload.date || parsed.date,
      parsed.time,
      payload.time || parsed.time,
      payload.guests || null,
      payload.comment || "",
    ],
  );

  return toReservationPayload(result.rows[0]);
}

export async function setTelegramMessageId(id: number, messageId: number) {
  const client = await getClient();
  await client.query(
    `
      UPDATE reservations
      SET telegram_message_id = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [id, messageId],
  );
}

export async function updateReservationStatus(id: number, status: string) {
  await ensureReservationsTable();
  const client = await getClient();
  const result = await client.query<Record<string, unknown>>(
    `
      UPDATE reservations
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, status],
  );

  if (!result.rows[0]) {
    throw new Error("Reservation not found");
  }

  return toReservationPayload(result.rows[0]);
}
