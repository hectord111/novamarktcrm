import { NextResponse, type NextRequest } from 'next/server';
import { dbConfigured } from '@/lib/db';
import { runNoResponseAutomations } from '@/lib/automation-engine';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get('authorization');
  const query = req.nextUrl.searchParams.get('secret');
  return header === `Bearer ${secret}` || query === secret;
}

/** Process time-based follow-ups. Schedule this every ~15 min (e.g. Vercel Cron). */
async function handle(req: NextRequest) {
  if (!dbConfigured()) return NextResponse.json({ error: 'DB no configurada' }, { status: 500 });
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const processed = await runNoResponseAutomations();
  return NextResponse.json({ ok: true, processed });
}

export const GET = handle;
export const POST = handle;
