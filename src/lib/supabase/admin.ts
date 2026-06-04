import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. Only used for Auth admin tasks that require elevated
 * privileges, e.g. inviting team members / client-portal users.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function adminConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
