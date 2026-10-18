import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!['admin', 'gerente'].includes(session.role)) {
    redirect('/dashboard?error=no_autorizado');
  }

  const db = await dbManager.getDb();
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const stages = db.pipeline_stages.filter((s) => s.organization_id === session.organization_id);
  const quotes = db.quotes.filter((q) => q.organization_id === session.organization_id);
  const users = db.profiles.filter((u) => u.organization_id === session.organization_id);
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);
  const auditLogs = db.audit_logs.filter((l) => l.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <ReportsClient
        opportunities={opportunities}
        clients={clients}
        stages={stages}
        quotes={quotes}
        users={users}
        activities={activities}
        auditLogs={auditLogs}
        currentUser={session}
      />
    </AppShell>
  );
}
