import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { KanbanClient } from './KanbanClient';

export const dynamic = 'force-dynamic';

export default async function EmbudoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = await dbManager.getDb();
  const stages = db.pipeline_stages
    .filter((s) => s.organization_id === session.organization_id)
    .sort((a, b) => a.order_index - b.order_index);

  const opportunities = db.opportunities.filter(
    (o) => o.organization_id === session.organization_id
  );

  const clients = db.clients.filter(
    (c) => c.organization_id === session.organization_id
  );

  const contacts = db.contacts.filter(
    (cnt) => cnt.organization_id === session.organization_id
  );

  const users = db.profiles
    .filter((u) => u.organization_id === session.organization_id && u.is_active)
    .map(({ password_hash, ...rest }) => rest as any);

  return (
    <AppShell user={session}>
      <KanbanClient
        initialStages={stages}
        initialOpportunities={opportunities}
        clients={clients}
        contacts={contacts}
        users={users}
        currentUser={session}
      />
    </AppShell>
  );
}
