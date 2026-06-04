import 'server-only';
import { sql, toJson } from '../db';
import { isAgency, type Actor, type Automation, type AutomationAction, type AutomationTrigger } from '../types';

export interface AutomationListItem extends Automation {
  client_name: string | null;
}

export async function listAutomations(actor: Actor): Promise<AutomationListItem[]> {
  const scope = isAgency(actor) ? sql`true` : sql`(a.client_id = ${actor.client_id} or a.client_id is null)`;
  const rows = await sql`
    select a.*, cl.name as client_name
    from nova.automations a
    left join nova.clients cl on cl.id = a.client_id
    where ${scope}
    order by a.is_active desc, a.created_at desc`;
  return rows as unknown as AutomationListItem[];
}

export async function getAutomation(actor: Actor, id: string) {
  const scope = isAgency(actor) ? sql`true` : sql`(a.client_id = ${actor.client_id} or a.client_id is null)`;
  const [a] = await sql`select a.* from nova.automations a where a.id = ${id} and ${scope} limit 1`;
  if (!a) return null;
  const runs = await sql`
    select r.*, l.full_name as lead_name from nova.automation_runs r
    left join nova.leads l on l.id = r.lead_id
    where r.automation_id = ${id} order by r.created_at desc limit 25`;
  return { automation: a as unknown as Automation, runs: runs as unknown as Record<string, unknown>[] };
}

export interface AutomationInput {
  name: string;
  description?: string | null;
  client_id?: string | null;
  trigger: AutomationTrigger;
  trigger_config?: Record<string, unknown>;
  actions: AutomationAction[];
  is_active?: boolean;
}

export async function createAutomation(actor: Actor, input: AutomationInput): Promise<Automation> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  const [a] = await sql`
    insert into nova.automations (name, description, client_id, trigger, trigger_config, actions, is_active)
    values (${input.name}, ${input.description ?? null}, ${input.client_id ?? null}, ${input.trigger},
            ${toJson(input.trigger_config ?? {})}, ${toJson(input.actions)}, ${input.is_active ?? true})
    returning *`;
  return a as unknown as Automation;
}

export async function updateAutomation(actor: Actor, id: string, input: AutomationInput): Promise<boolean> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`
    update nova.automations set
      name = ${input.name}, description = ${input.description ?? null}, client_id = ${input.client_id ?? null},
      trigger = ${input.trigger}, trigger_config = ${toJson(input.trigger_config ?? {})},
      actions = ${toJson(input.actions)}, is_active = ${input.is_active ?? true}
    where id = ${id}`;
  return true;
}

export async function toggleAutomation(actor: Actor, id: string, isActive: boolean) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`update nova.automations set is_active = ${isActive} where id = ${id}`;
  return true;
}

export async function deleteAutomation(actor: Actor, id: string) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`delete from nova.automations where id = ${id}`;
  return true;
}

export async function getAutomationStats(actor: Actor) {
  const scope = isAgency(actor) ? sql`true` : sql`(client_id = ${actor.client_id} or client_id is null)`;
  const [row] = await sql`
    select count(*)::int as total,
           count(*) filter (where is_active)::int as active,
           coalesce(sum(run_count), 0)::int as total_runs
    from nova.automations where ${scope}`;
  return row as unknown as { total: number; active: number; total_runs: number };
}
