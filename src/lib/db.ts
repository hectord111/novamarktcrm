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
/**
 * Connection string for the data layer. Auth always stays in Supabase; the data
 * lives in this same Supabase project's Postgres, wired by the Vercel ↔ Supabase
 * integration as POSTGRES_URL. DATABASE_URL kept as a manual fallback.
 */
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

const globalForDb = globalThis as unknown as { novaSql?: postgres.Sql };

function create(): postgres.Sql | undefined {
  if (!url) return undefined;
  // Every query is schema-qualified (`nova.*`), so we don't depend on search_path.
  // `prepare: false` keeps us compatible with Supabase's transaction pooler.
  return postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
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
