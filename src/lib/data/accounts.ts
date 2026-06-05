import 'server-only';
import { cache } from 'react';
import { sql } from '../db';
import { isAgency, type Actor } from '../types';

export interface AccountOption {
  id: string;
  name: string;
  color: string | null;
  kind: 'client' | 'internal';
}

/** The internal "Nova Marketing" account — where Nova's own client-acquisition lives. */
export const getNovaAccount = cache(async (): Promise<AccountOption | null> => {
  const [row] = await sql`
    select id, name, color, kind from nova.clients
    where kind = 'internal' order by created_at limit 1`;
  return (row as unknown as AccountOption) ?? null;
});

/** Accounts for the switcher: Nova first, then real clients. */
export const listAccountOptions = cache(async (): Promise<AccountOption[]> => {
  const rows = await sql`
    select id, name, color, kind from nova.clients
    where status <> 'archived'
    order by (kind <> 'internal'), name`;
  return rows as unknown as AccountOption[];
});

export type AccountView =
  | { mode: 'nova'; clientId: string; label: string }
  | { mode: 'client'; clientId: string; label: string }
  | { mode: 'portfolio'; excludeClientId: string | null; label: string };

/**
 * Resolve the selected account from a `?account=` param into a scope.
 * Agency default = Nova (the user's own funnel). `all` = whole portfolio (excludes Nova).
 * Client-role users are always locked to their own client.
 */
export async function resolveAccount(actor: Actor, param: string | undefined): Promise<AccountView> {
  const nova = await getNovaAccount();

  if (!isAgency(actor)) {
    return { mode: 'client', clientId: actor.client_id ?? '', label: 'Mi cuenta' };
  }

  const value = param || (nova ? 'nova' : 'all');

  if (value === 'all') {
    return { mode: 'portfolio', excludeClientId: nova?.id ?? null, label: 'Toda la cartera' };
  }
  if (nova && (value === 'nova' || value === nova.id)) {
    return { mode: 'nova', clientId: nova.id, label: 'Nova · captación' };
  }

  const options = await listAccountOptions();
  const match = options.find((o) => o.id === value);
  if (match) return { mode: 'client', clientId: match.id, label: match.name };

  // Unknown value → fall back to Nova (or portfolio if Nova missing).
  return nova
    ? { mode: 'nova', clientId: nova.id, label: 'Nova · captación' }
    : { mode: 'portfolio', excludeClientId: null, label: 'Toda la cartera' };
}
