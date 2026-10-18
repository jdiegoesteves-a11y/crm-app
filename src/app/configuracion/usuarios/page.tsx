import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { UserManagementClient } from './UserManagementClient';

export const dynamic = 'force-dynamic';


export default async function UsuariosConfigPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Restricción RBAC: Solo administradores
  if (session.role !== 'admin') {
    redirect('/dashboard?error=no_autorizado');
  }

  const db = dbManager.getDb();
  const profiles = db.profiles
    .filter((p) => p.organization_id === session.organization_id)
    .map(({ password_hash, ...rest }) => rest as any);

  return (
    <AppShell user={session}>
      <UserManagementClient initialProfiles={profiles} currentUser={session} />
    </AppShell>
  );
}
