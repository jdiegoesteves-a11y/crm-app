import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { QuotesClient } from './QuotesClient';

export const dynamic = 'force-dynamic';

export default async function CotizacionesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = await dbManager.getDb();
  const quotes = db.quotes.filter((q) => q.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <QuotesClient quotes={quotes} clients={clients} currentUser={session} />
    </AppShell>
  );
}
