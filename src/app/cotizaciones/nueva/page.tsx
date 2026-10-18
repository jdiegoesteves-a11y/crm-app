import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { NewQuoteClient } from './NewQuoteClient';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'consulta') redirect('/cotizaciones');

  const db = dbManager.getDb();
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const products = db.products.filter((p) => p.organization_id === session.organization_id && p.is_active);

  return (
    <AppShell user={session}>
      <NewQuoteClient
        clients={clients}
        opportunities={opportunities}
        products={products}
        currentUser={session}
      />
    </AppShell>
  );
}
