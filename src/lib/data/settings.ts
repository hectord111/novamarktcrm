import 'server-only';
import { sql, toJson } from '../db';

export async function getGlobalSetting<T = Record<string, unknown>>(key: string): Promise<T | null> {
  const [r] = await sql`select value from nova.settings where key = ${key} and client_id is null limit 1`;
  return (r?.value as T) ?? null;
}

export async function setGlobalSetting(key: string, value: Record<string, unknown>) {
  await sql`
    insert into nova.settings (client_id, key, value) values (null, ${key}, ${toJson(value)})
    on conflict (key) where client_id is null do update set value = excluded.value, updated_at = now()`;
}

export interface WhatsappConfig {
  mode: 'simulation' | 'live';
  provider: 'whatsapp_cloud';
  phone_number_id?: string;
  from?: string;
}

export async function getWhatsappConfig(): Promise<WhatsappConfig> {
  const cfg = await getGlobalSetting<WhatsappConfig>('whatsapp');
  return cfg ?? { mode: 'simulation', provider: 'whatsapp_cloud' };
}
