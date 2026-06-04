import 'server-only';
import postgres from 'postgres';

/**
 * Direct Postgres connection to the isolated `nova` schema in Supabase.
 *
 * We talk to the database server-side only (never from the browser) and we
 * schema-qualify every table (`nova.*`) so the connection works regardless of
 * the pooler mode. `prepare: false` keeps us compatible with Supabase's
 * transaction pooler (PgBouncer).
 */
const url = process.env.DATABASE_URL || '';

const globalForDb = globalThis as unknown as { novaSql?: postgres.Sql };

function create(): postgres.Sql | undefined {
  if (!url) return undefined;
  return postgres(url, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
    connection: { search_path: 'nova, public' },
  });
}

export const sql: postgres.Sql = (globalForDb.novaSql ?? create()) as postgres.Sql;

if (process.env.NODE_ENV !== 'production' && sql) globalForDb.novaSql = sql;

/** Whether a database connection string is configured. */
export function dbConfigured(): boolean {
  return Boolean(url);
}

/** Wrap an arbitrary value as a jsonb parameter (relaxes postgres-js JSON typing). */
export function toJson(value: unknown) {
  return sql.json(value as never);
}
