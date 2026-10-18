import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const db = dbManager.getDb();

  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const leads = db.leads.filter((l) => l.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);
  const stages = db.pipeline_stages.filter((s) => s.organization_id === session.organization_id);
  const quotes = db.quotes.filter((q) => q.organization_id === session.organization_id);
  const products = db.products.filter((p) => p.organization_id === session.organization_id);
  const users = db.profiles.filter((u) => u.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <DashboardClient
        opportunities={opportunities}
        leads={leads}
        clients={clients}
        activities={activities}
        stages={stages}
        quotes={quotes}
        products={products}
        users={users}
        currentUser={session}
      />
    </AppShell>
  );
}
