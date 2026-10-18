import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar, UrgentActivityNotification } from './Topbar';
import { SessionUser } from '@/types/database';
import { dbManager } from '@/lib/db';

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export async function AppShell({ user, children }: AppShellProps) {
  const db = await dbManager.getDb();
  const now = new Date().getTime();

  // Filtrar actividades urgentes y pendientes para las notificaciones de la Topbar
  const urgentActivities: UrgentActivityNotification[] = db.activities
    .filter(
      (a) =>
        a.organization_id === user.organization_id &&
        a.status !== 'completada' &&
        a.status !== 'cancelada'
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title,
      due_date: a.due_date,
      type: a.type,
      is_overdue: new Date(a.due_date).getTime() < now,
    }));

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F4F7FA] flex">
      {/* Sidebar Fija */}
      <Sidebar user={user} />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col pl-20 transition-all duration-300 min-w-0">
        <Topbar
          user={user}
          unreadActivitiesCount={urgentActivities.length}
          urgentActivities={urgentActivities}
        />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
