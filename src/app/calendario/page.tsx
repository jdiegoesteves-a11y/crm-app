import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { CalendarClient } from './CalendarClient';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = await dbManager.getDb();
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const users = db.profiles
    .filter((u) => u.organization_id === session.organization_id && u.is_active)
    .map(({ password_hash, ...rest }) => rest as any);

  return (
    <AppShell user={session}>
      <CalendarClient
        initialActivities={activities}
        opportunities={opportunities}
        clients={clients}
        users={users}
        currentUser={session}
      />
    </AppShell>
  );
}
