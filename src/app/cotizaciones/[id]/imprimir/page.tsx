import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { PrintableQuoteClient } from './PrintableQuoteClient';

export const dynamic = 'force-dynamic';

export default async function ImprimirCotizacionPage({
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

  const org = db.organizations.find((o) => o.id === session.organization_id) || {
    id: session.organization_id,
    name: session.organization_name || 'Acme Industrial & Services S.A.',
    tax_id: '1792345678001',
    currency: 'USD',
    timezone: 'America/Guayaquil',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const items = db.quote_items.filter((i) => i.quote_id === quote.id);
  const creator = db.profiles.find((p) => p.id === quote.created_by);

  return (
    <PrintableQuoteClient
      quote={quote}
      client={client}
      org={org}
      items={items}
      creator={creator}
    />
  );
}
