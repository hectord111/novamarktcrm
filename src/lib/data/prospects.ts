import 'server-only';
import { sql, toJson } from '../db';
import { isAgency, type Actor } from '../types';
import { buildLanding, slugifyLanding, type LandingConfig } from '../landing';
import { createLead } from './leads';
import { getNovaAccount } from './accounts';

export type ProspectStatus = 'new' | 'contacted' | 'replied' | 'interested' | 'converted' | 'discarded';

export interface Prospect {
  id: string;
  business_name: string;
  sector: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  google_place_id: string | null;
  has_website: boolean;
  website_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  status: ProspectStatus;
  landing: LandingConfig;
  landing_slug: string | null;
  pitch: string | null;
  lead_id: string | null;
  contacted_at: string | null;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

function assertAgency(actor: Actor) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
}

export async function listProspects(actor: Actor, f: { status?: ProspectStatus; search?: string } = {}) {
  assertAgency(actor);
  const conds = [sql`true`];
  if (f.status) conds.push(sql`status = ${f.status}`);
  if (f.search) {
    const q = `%${f.search}%`;
    conds.push(sql`(business_name ilike ${q} or city ilike ${q} or sector ilike ${q} or phone ilike ${q})`);
  }
  const where = conds.reduce((a, c) => sql`${a} and ${c}`);
  const rows = await sql`select * from nova.prospects where ${where} order by created_at desc limit 500`;
  return rows as unknown as Prospect[];
}

export async function countProspectsByStatus(actor: Actor) {
  assertAgency(actor);
  const rows = await sql`select status, count(*)::int as n from nova.prospects group by status`;
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.n;
  return map;
}

export async function getProspect(actor: Actor, id: string) {
  assertAgency(actor);
  const [row] = await sql`select * from nova.prospects where id = ${id} limit 1`;
  return (row as unknown as Prospect) ?? null;
}

/** Public lookup used by the /l/[slug] demo-landing route (no auth). */
export async function getProspectBySlug(slug: string) {
  const [row] = await sql`
    select * from nova.prospects
    where landing_slug = ${slug} and status <> 'discarded' limit 1`;
  return (row as unknown as Prospect) ?? null;
}

export interface ProspectInput {
  business_name: string;
  sector?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  google_place_id?: string | null;
  has_website?: boolean;
  website_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  source?: string;
}

async function freeSlug(name: string, city?: string | null) {
  let slug = slugifyLanding(name, city);
  const [exists] = await sql`select 1 from nova.prospects where landing_slug = ${slug} limit 1`;
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  return slug;
}

/** Import prospects (deduped by google_place_id) with an auto-generated landing. */
export async function createProspects(actor: Actor, inputs: ProspectInput[]): Promise<number> {
  assertAgency(actor);
  let imported = 0;
  for (const input of inputs) {
    if (input.google_place_id) {
      const [dupe] = await sql`select 1 from nova.prospects where google_place_id = ${input.google_place_id} limit 1`;
      if (dupe) continue;
    }
    const landing = buildLanding(input.business_name, input.sector ?? null, input.city ?? null);
    const slug = await freeSlug(input.business_name, input.city);
    await sql`
      insert into nova.prospects
        (business_name, sector, city, address, phone, google_place_id, has_website, website_url,
         rating, reviews_count, landing, landing_slug, source)
      values
        (${input.business_name}, ${input.sector ?? null}, ${input.city ?? null}, ${input.address ?? null},
         ${input.phone ?? null}, ${input.google_place_id ?? null}, ${input.has_website ?? false},
         ${input.website_url ?? null}, ${input.rating ?? null}, ${input.reviews_count ?? null},
         ${toJson(landing)}, ${slug}, ${input.source ?? 'places'})`;
    imported++;
  }
  return imported;
}

export interface ProspectPatch {
  business_name?: string;
  sector?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
  pitch?: string | null;
  landing?: LandingConfig;
}

export async function updateProspect(actor: Actor, id: string, patch: ProspectPatch) {
  assertAgency(actor);
  await sql`
    update nova.prospects set
      business_name = coalesce(${patch.business_name ?? null}, business_name),
      sector  = coalesce(${patch.sector ?? null}, sector),
      city    = coalesce(${patch.city ?? null}, city),
      address = ${patch.address ?? null},
      phone   = ${patch.phone ?? null},
      notes   = ${patch.notes ?? null},
      pitch   = ${patch.pitch ?? null},
      landing = coalesce(${patch.landing ? toJson(patch.landing) : null}, landing)
    where id = ${id}`;
}

export async function setProspectStatus(actor: Actor, id: string, status: ProspectStatus) {
  assertAgency(actor);
  await sql`
    update nova.prospects set
      status = ${status},
      contacted_at = case when ${status} = 'contacted' then coalesce(contacted_at, now()) else contacted_at end
    where id = ${id}`;
}

export async function deleteProspect(actor: Actor, id: string) {
  assertAgency(actor);
  await sql`delete from nova.prospects where id = ${id}`;
}

/** Won the conversation → becomes a lead of the internal Nova account. */
export async function convertProspectToLead(actor: Actor, id: string): Promise<string | null> {
  assertAgency(actor);
  const prospect = await getProspect(actor, id);
  if (!prospect) return null;
  if (prospect.lead_id) return prospect.lead_id;
  const nova = await getNovaAccount();
  if (!nova) throw new Error('No existe la cuenta interna Nova');
  const lead = await createLead({
    client_id: nova.id,
    full_name: prospect.business_name,
    phone: prospect.phone,
    email: prospect.email,
    source: 'prospecting',
    status: 'qualified',
    custom_fields: { sector: prospect.sector, city: prospect.city, landing: prospect.landing_slug },
  });
  await sql`update nova.prospects set status = 'converted', lead_id = ${lead.id} where id = ${id}`;
  return lead.id;
}
