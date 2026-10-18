import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentsClient } from './DocumentsClient';

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const documents = (db.documents || []).filter(
    (d) => d.organization_id === session.organization_id
  );
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const quotes = db.quotes.filter((q) => q.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <DocumentsClient
        documents={documents}
        clients={clients}
        quotes={quotes}
        currentUser={session}
      />
    </AppShell>
  );
}
