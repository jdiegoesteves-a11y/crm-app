import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ProductsClient } from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const products = db.products.filter((p) => p.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <ProductsClient
        initialProducts={products}
        currentUser={session}
      />
    </AppShell>
  );
}
