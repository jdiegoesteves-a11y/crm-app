import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { QuoteDetailClient } from './QuoteDetailClient';

export const dynamic = 'force-dynamic';

export default async function DetalleCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const db = await dbManager.getDb();

  const quote = db.quotes.find(
    (q) => q.id === id && q.organization_id === session.organization_id
  );

  if (!quote) notFound();

  const client = db.clients.find((c) => c.id === quote.client_id);
  if (!client) notFound();

  const opportunity = quote.opportunity_id
    ? db.opportunities.find((o) => o.id === quote.opportunity_id)
    : undefined;

  const items = db.quote_items.filter((i) => i.quote_id === quote.id);
  const creator = db.profiles.find((p) => p.id === quote.created_by);

  return (
    <AppShell user={session}>
      <QuoteDetailClient
        quote={quote}
        client={client}
        opportunity={opportunity}
        items={items}
        creator={creator}
        currentUser={session}
      />
    </AppShell>
  );
}
