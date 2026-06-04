import { redirect } from 'next/navigation';
import { dbConfigured } from '@/lib/db';
import { supabaseConfigured } from '@/lib/supabase/server';
import { getActor } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!dbConfigured() || !supabaseConfigured()) redirect('/setup');
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (!actor.is_active) redirect('/pending');
  redirect('/dashboard');
}
