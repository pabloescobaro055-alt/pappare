import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import { movieEvents } from '@/data/cinema';
import { seatIds } from '@/data/cinema-hall';

type Row = Record<string, unknown>;
export type Connection = { query: (sql:string, params?:unknown[])=>Promise<Row[]> };
const state = globalThis as unknown as { cinemaPool?:Pool; cinemaSqlite?:DatabaseSync; cinemaQueue?:Promise<unknown>; cinemaReady?:Promise<void> };
async function sqlite() {
  if (!state.cinemaSqlite) {
    if (process.env.NODE_ENV === 'production' && process.env.CINEMA_DEMO === 'false') throw new Error('DATABASE_URL required for production cinema sales');
    const file = process.env.CINEMA_SQLITE_PATH || path.join(process.cwd(), 'work', 'cinema.sqlite');
    mkdirSync(path.dirname(file), {recursive:true});
    const importer = new Function('return import("node:sqlite")') as ()=>Promise<typeof import('node:sqlite')>;
    const {DatabaseSync} = await importer();
    state.cinemaSqlite = new DatabaseSync(file);
    state.cinemaSqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  }
  return state.cinemaSqlite;
}
async function rawTransaction<T>(fn:(db:Connection)=>Promise<T>):Promise<T> {
  if (process.env.DATABASE_URL) {
    state.cinemaPool ??= new Pool({connectionString:process.env.DATABASE_URL});
    const client = await state.cinemaPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(72843192)');
      const value = await fn({query:async(sql,params=[]) => (await client.query(sql,params)).rows});
      await client.query('COMMIT'); return value;
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally {client.release();}
  }
  const run = async()=>{
    const db = await sqlite();
    db.exec('BEGIN IMMEDIATE');
    try {
      const value = await fn({query:async(sql,params=[])=>{
        const args: (string|number|null)[] = [];
        const statement = db.prepare(sql.replace(/\$(\d+)/g,(_,n)=>{args.push(params[Number(n)-1] as string|number|null);return '?';}));
        return statement.all(...args) as Row[];
      }});
      db.exec('COMMIT'); return value;
    } catch(e) {db.exec('ROLLBACK');throw e;}
  };
  const promise = (state.cinemaQueue || Promise.resolve()).then(run,run);
  state.cinemaQueue = promise.catch(()=>{});
  return promise;
}
const schema = [
  `CREATE TABLE IF NOT EXISTS cinema_event_overrides (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cinema_media (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cinema_admin_audit (id TEXT PRIMARY KEY, action TEXT NOT NULL, order_id TEXT NOT NULL, note TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS movie_events (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cinema_orders (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES movie_events(id), customer_name TEXT NOT NULL, phone TEXT NOT NULL, telegram TEXT NOT NULL, total_amount INTEGER NOT NULL, status TEXT NOT NULL, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, request_key TEXT UNIQUE NOT NULL, payment_data TEXT NOT NULL DEFAULT '{}')`,
  `CREATE TABLE IF NOT EXISTS cinema_seats (event_id TEXT NOT NULL REFERENCES movie_events(id), id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'available', hold_order_id TEXT REFERENCES cinema_orders(id), hold_until BIGINT, PRIMARY KEY(event_id,id))`,
  `CREATE TABLE IF NOT EXISTS cinema_order_seats (order_id TEXT NOT NULL REFERENCES cinema_orders(id), seat_id TEXT NOT NULL, PRIMARY KEY(order_id,seat_id))`,
  `CREATE TABLE IF NOT EXISTS cinema_rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cinema_notifications (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES cinema_orders(id), text TEXT NOT NULL, delivered INTEGER NOT NULL DEFAULT 0)`,
];
export async function transaction<T>(fn:(db:Connection)=>Promise<T>) {
  if (!state.cinemaReady) state.cinemaReady = rawTransaction(async db=>{
    for (const sql of schema) await db.query(sql);
    for (const e of movieEvents) {
      await db.query('INSERT INTO movie_events(id,data) VALUES ($1,$2) ON CONFLICT(id) DO NOTHING',[e.id,JSON.stringify(e)]);
      for (const seat of seatIds) await db.query('INSERT INTO cinema_seats(event_id,id) VALUES ($1,$2) ON CONFLICT(event_id,id) DO NOTHING',[e.id,seat]);
    }
  }).catch(e=>{state.cinemaReady=undefined;throw e;});
  await state.cinemaReady;
  return rawTransaction(fn);
}
