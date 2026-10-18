import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SessionUser } from '@/types/database';

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F4F7FA] flex">
      {/* Sidebar Fija */}
      <Sidebar user={user} />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col pl-20 transition-all duration-300 min-w-0">
        <Topbar user={user} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
