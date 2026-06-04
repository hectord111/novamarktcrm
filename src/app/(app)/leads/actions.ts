'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/auth';
import { createLead, updateLeadStatus, addNote, assignLead } from '@/lib/data/leads';
import { onLeadCreated } from '@/lib/automation-engine';
import type { LeadStatus } from '@/lib/types';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}

export async function createLeadAction(formData: FormData) {
  const actor = await requireActor();
  const formClient = str(formData, 'client_id');
  const client_id = actor.role === 'client' ? actor.client_id : formClient;
  if (!client_id) throw new Error('Selecciona un cliente');

  const lead = await createLead({
    client_id,
    full_name: str(formData, 'full_name'),
    email: str(formData, 'email'),
    phone: str(formData, 'phone'),
    campaign_id: str(formData, 'campaign_id'),
    source: str(formData, 'source') ?? 'manual',
    status: 'new',
  });
  // Fire 'lead_created' automations (welcome WhatsApp, etc.)
  await onLeadCreated(lead);
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  revalidatePath('/pipeline');
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as LeadStatus;
  const valueEur = formData.get('value_eur');
  const value_cents = valueEur && String(valueEur).trim() ? Math.round(Number(valueEur) * 100) : null;
  const lost_reason = str(formData, 'lost_reason');
  await updateLeadStatus(actor, id, status, { value_cents, lost_reason });
  revalidatePath(`/leads/${id}`);
  revalidatePath('/leads');
  revalidatePath('/pipeline');
  revalidatePath('/dashboard');
}

export async function addNoteAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const content = str(formData, 'content');
  if (content) {
    await addNote(actor, id, content);
    revalidatePath(`/leads/${id}`);
  }
}

export async function assignLeadAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const userId = str(formData, 'user_id');
  await assignLead(actor, id, userId);
  revalidatePath(`/leads/${id}`);
}
