import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { MessagesClient } from './MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MensajesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = await dbManager.getDb();
  const orgId = session.organization_id;

  const conversations = (db.conversations || []).filter((c) => c.organization_id === orgId);
  const messages = (db.messages || []).filter((m) => m.organization_id === orgId);
  const clients = db.clients.filter((c) => c.organization_id === orgId);
  const leads = db.leads.filter((l) => l.organization_id === orgId);
  const opportunities = db.opportunities.filter((o) => o.organization_id === orgId);
  const users = db.profiles.filter((u) => u.organization_id === orgId);

  const igIntegration = db.integrations?.find(
    (i) => i.organization_id === orgId && i.provider === 'instagram' && i.status === 'conectado'
  );
  const isInstagramConnected = Boolean(igIntegration);
  const connectedUsername = igIntegration?.account_username;

  return (
    <AppShell user={session}>
      <MessagesClient
        conversations={conversations}
        messages={messages}
        clients={clients}
        leads={leads}
        opportunities={opportunities}
        users={users}
        currentUser={session}
        isInstagramConnected={isInstagramConnected}
        connectedUsername={connectedUsername}
      />
    </AppShell>
  );
}
