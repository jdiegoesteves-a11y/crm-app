import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { InstagramIntegrationClient } from './InstagramIntegrationClient';

export const dynamic = 'force-dynamic';

export default async function InstagramIntegrationPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!['admin', 'gerente'].includes(session.role)) {
    redirect('/dashboard?error=no_autorizado');
  }

  const db = await dbManager.getDb();
  const integration = db.integrations.find(
    (i) => i.organization_id === session.organization_id && i.provider === 'instagram'
  ) || null;

  const appId = process.env.INSTAGRAM_APP_ID || '1107212452239193';
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'crm_executive_ig_verify_token_2026_secure';
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  return (
    <AppShell user={session}>
      <InstagramIntegrationClient
        integration={integration}
        currentUser={session}
        appId={appId}
        verifyToken={verifyToken}
        baseUrl={baseUrl}
      />
    </AppShell>
  );
}
