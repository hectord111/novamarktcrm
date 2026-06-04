import { requireActor } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Sidebar } from '@/components/app/Sidebar';
import { MobileNav } from '@/components/app/MobileNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  let clientName: string | null = null;
  if (actor.role === 'client' && actor.client_id) {
    const [c] = await sql`select name from nova.clients where id = ${actor.client_id} limit 1`;
    clientName = (c?.name as string) ?? null;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar actor={actor} clientName={clientName} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileNav actor={actor} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
