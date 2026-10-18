import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ClientDetailClient } from './ClientDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const db = dbManager.getDb();

  const client = db.clients.find(
    (c) => c.id === id && c.organization_id === session.organization_id
  );

  if (!client) {
    notFound();
  }

  const contacts = db.contacts.filter(
    (cnt) => cnt.client_id === id && cnt.organization_id === session.organization_id
  );

  const opportunities = db.opportunities.filter(
    (o) => o.client_id === id && o.organization_id === session.organization_id
  );

  const quotes = db.quotes.filter(
    (q) => q.client_id === id && q.organization_id === session.organization_id
  );

  const activities = db.activities.filter(
    (a) => a.client_id === id && a.organization_id === session.organization_id
  );

  const users = db.profiles
    .filter((u) => u.organization_id === session.organization_id && u.is_active)
    .map(({ password_hash, ...rest }) => rest as any);

  const stages = db.pipeline_stages
    .filter((s) => s.organization_id === session.organization_id)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <AppShell user={session}>
      <ClientDetailClient
        client={client}
        contacts={contacts}
        opportunities={opportunities}
        quotes={quotes}
        activities={activities}
        users={users}
        stages={stages}
        currentUser={session}
      />
    </AppShell>
  );
}
