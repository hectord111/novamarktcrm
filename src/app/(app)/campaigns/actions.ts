'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/auth';
import { createCampaign, updateCampaignStatus } from '@/lib/data/campaigns';
import { listClients } from '@/lib/data/clients';
import { syncMetaForClient } from '@/lib/meta';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}

export async function createCampaignAction(formData: FormData) {
  const actor = await requireActor();
  const client_id = str(formData, 'client_id');
  const name = str(formData, 'name');
  if (!client_id || !name) throw new Error('Cliente y nombre son obligatorios');
  const budget = formData.get('daily_budget_eur');
  const campaign = await createCampaign(actor, {
    client_id,
    name,
    objective: str(formData, 'objective'),
    channel: str(formData, 'channel') ?? 'meta',
    status: (str(formData, 'status') as 'active' | 'paused' | 'draft' | null) ?? 'active',
    daily_budget_cents: budget && String(budget).trim() ? Math.round(Number(budget) * 100) : null,
    meta_campaign_id: str(formData, 'meta_campaign_id'),
  });
  revalidatePath('/campaigns');
  redirect(`/clients/${campaign.client_id}`);
}

export async function toggleCampaignStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as 'active' | 'paused';
  await updateCampaignStatus(actor, id, status);
  revalidatePath('/campaigns');
}

export async function syncAllMetaAction() {
  const actor = await requireActor();
  const clients = await listClients(actor);
  for (const c of clients) {
    try {
      await syncMetaForClient(c.id);
    } catch {
      // continue with the next client
    }
  }
  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
}
