'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  UserCheck,
  Building2,
  Users,
  CheckSquare,
  Calendar,
  Layers,
  FileSpreadsheet,
  FolderArchive,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { SessionUser, UserRole } from '@/types/database';
import { logoutAction } from '@/app/actions/auth';

interface SidebarProps {
  user: SessionUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const roleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-[#28B8AA]/15', text: 'text-[#28B8AA]', label: 'Administrador' },
    gerente: { bg: 'bg-[#34C48A]/15', text: 'text-[#34C48A]', label: 'Gerente Comercial' },
    vendedor: { bg: 'bg-[#F0B454]/15', text: 'text-[#F0B454]', label: 'Vendedor Senior' },
    consulta: { bg: 'bg-[#A5B2C1]/15', text: 'text-[#A5B2C1]', label: 'Auditoría / Consulta' },
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Embudo Comercial', href: '/embudo', icon: Kanban },
    { label: 'Prospectos', href: '/prospectos', icon: UserCheck },
    { label: 'Clientes', href: '/clientes', icon: Building2 },
    { label: 'Contactos', href: '/contactos', icon: Users },
    { label: 'Actividades', href: '/actividades', icon: CheckSquare },
    { label: 'Calendario', href: '/calendario', icon: Calendar },
    { label: 'Catálogo', href: '/catalogo', icon: Layers },
    { label: 'Cotizaciones', href: '/cotizaciones', icon: FileSpreadsheet },
    { label: 'Documentos', href: '/documentos', icon: FolderArchive },
    ...(user.role === 'admin' || user.role === 'gerente'
      ? [{ label: 'Reportes', href: '/reportes', icon: BarChart3 }]
      : []),
    ...(user.role === 'admin' || user.role === 'gerente'
      ? [{ label: 'Configuración', href: '/configuracion', icon: Settings }]
      : []),
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#151F2A] border-r border-[#30404E] z-40 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#30404E]">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#28B8AA]/20 border border-[#28B8AA]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#28B8AA]/10">
              <TrendingUp className="w-5 h-5 text-[#28B8AA]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider text-[#F4F7FA]">EXECUTIVE</span>
                <span className="text-[10px] tracking-widest text-[#28B8AA] font-semibold">DARK CRM 2.0</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#A5B2C1] hover:text-[#F4F7FA] p-1.5 rounded-lg hover:bg-[#202C39] transition-colors"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#202C39] text-[#28B8AA] border-l-4 border-[#28B8AA] shadow-sm'
                    : 'text-[#A5B2C1] hover:text-[#F4F7FA] hover:bg-[#202C39]/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#28B8AA]' : 'text-[#A5B2C1] group-hover:text-[#F4F7FA]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Role */}
      <div className="p-3 border-t border-[#30404E] bg-[#111A24]">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#202C39] border border-[#30404E] flex items-center justify-center font-bold text-xs text-[#28B8AA] shrink-0">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#F4F7FA] truncate">{user.full_name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded w-fit mt-0.5 ${roleColors[user.role].bg} ${roleColors[user.role].text}`}>
                  {roleColors[user.role].label}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-[#A5B2C1] hover:text-[#F17474] p-1.5 rounded-lg hover:bg-[#202C39] transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
