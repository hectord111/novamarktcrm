import { NextResponse, type NextRequest } from 'next/server';
import { sql, dbConfigured } from '@/lib/db';
import { syncMetaForClient, metaConfigured } from '@/lib/meta';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get('authorization');
  const query = req.nextUrl.searchParams.get('secret');
  return header === `Bearer ${secret}` || query === secret;
}

/** Sync campaigns + spend from Meta for one client (?client_id=) or all clients. */
async function handle(req: NextRequest) {
  if (!dbConfigured()) return NextResponse.json({ error: 'DB no configurada' }, { status: 500 });
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!metaConfigured()) return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurada' }, { status: 400 });

  const clientId = req.nextUrl.searchParams.get('client_id');
  const ids = clientId ? [{ id: clientId }] : ((await sql`select id from nova.clients where status <> 'archived'`) as unknown as { id: string }[]);
  const results = [];
  for (const c of ids) {
    results.push({ client_id: c.id, ...(await syncMetaForClient(c.id)) });
  }
  return NextResponse.json({ ok: true, results });
}

export const GET = handle;
export const POST = handle;
