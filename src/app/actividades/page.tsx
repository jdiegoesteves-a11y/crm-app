import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ActivitiesClient } from './ActivitiesClient';

export const dynamic = 'force-dynamic';

export default async function ActividadesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const leads = db.leads.filter((l) => l.organization_id === session.organization_id);
  const users = db.profiles
    .filter((u) => u.organization_id === session.organization_id && u.is_active)
    .map(({ password_hash, ...rest }) => rest as any);

  return (
    <AppShell user={session}>
      <ActivitiesClient
        initialActivities={activities}
        clients={clients}
        opportunities={opportunities}
        leads={leads}
        users={users}
        currentUser={session}
      />
    </AppShell>
  );
}
