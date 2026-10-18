import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { LeadsClient } from './LeadsClient';

export const dynamic = 'force-dynamic';

export default async function ProspectosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = await dbManager.getDb();
  const leads = db.leads.filter((l) => l.organization_id === session.organization_id);
  const users = db.profiles
    .filter((u) => u.organization_id === session.organization_id && u.is_active)
    .map(({ password_hash, ...rest }) => rest as any);
  const stages = db.pipeline_stages
    .filter((s) => s.organization_id === session.organization_id)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <AppShell user={session}>
      <LeadsClient
        initialLeads={leads}
        users={users}
        stages={stages}
        currentUser={session}
      />
    </AppShell>
  );
}
