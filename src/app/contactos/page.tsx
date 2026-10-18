import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ContactsClient } from './ContactsClient';

export const dynamic = 'force-dynamic';

export default async function ContactosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const contacts = db.contacts.filter((c) => c.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <ContactsClient
        initialContacts={contacts}
        clients={clients}
        currentUser={session}
      />
    </AppShell>
  );
}
