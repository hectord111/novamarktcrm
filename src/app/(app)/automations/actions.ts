'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/auth';
import { createAutomation, updateAutomation, toggleAutomation, deleteAutomation } from '@/lib/data/automations';
import { runNoResponseAutomations } from '@/lib/automation-engine';
import type { AutomationAction, AutomationTrigger } from '@/lib/types';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}

const DEFAULT_BODY =
  '¡Hola {{nombre}}! 👋 Gracias por tu interés en {{cliente}}. Para ayudarte mejor, ¿podrías contarnos un poco más sobre lo que necesitas?';

function buildFromForm(formData: FormData) {
  const trigger = (str(formData, 'trigger') ?? 'lead_created') as AutomationTrigger;
  const body = str(formData, 'body') ?? DEFAULT_BODY;
  const delay = Number(formData.get('delay_minutes') || 0);
  const actions: AutomationAction[] = [{ type: 'send_whatsapp', delay_minutes: delay, body }];

  let trigger_config: Record<string, unknown> = {};
  if (trigger === 'no_response') {
    const hours = Number(formData.get('hours') || 24);
    const statuses = formData.getAll('statuses').map(String);
    trigger_config = { hours, statuses: statuses.length ? statuses : ['new', 'contacted'] };
  }
  return {
    name: str(formData, 'name') ?? 'Automatización',
    description: str(formData, 'description'),
    client_id: str(formData, 'client_id'),
    trigger,
    trigger_config,
    actions,
    is_active: formData.get('is_active') === 'on',
  };
}

export async function createAutomationAction(formData: FormData) {
  const actor = await requireActor();
  await createAutomation(actor, buildFromForm(formData));
  revalidatePath('/automations');
  redirect('/automations');
}

export async function updateAutomationAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  await updateAutomation(actor, id, buildFromForm(formData));
  revalidatePath('/automations');
  redirect('/automations');
}

export async function toggleAutomationAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const isActive = formData.get('is_active') === 'true';
  await toggleAutomation(actor, id, isActive);
  revalidatePath('/automations');
}

export async function deleteAutomationAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  await deleteAutomation(actor, id);
  revalidatePath('/automations');
  redirect('/automations');
}

export async function runFollowupsAction() {
  await requireActor();
  await runNoResponseAutomations();
  revalidatePath('/automations');
  revalidatePath('/leads');
}
