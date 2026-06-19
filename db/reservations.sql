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

CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations (status);
CREATE INDEX IF NOT EXISTS reservations_created_at_idx ON reservations (created_at DESC);
