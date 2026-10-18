'use client';

import React, { useState } from 'react';
import { Search, Bell, Building, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { SessionUser } from '@/types/database';
import { logoutAction } from '@/app/actions/auth';

interface TopbarProps {
  user: SessionUser;
  unreadActivitiesCount?: number;
}

export function Topbar({ user, unreadActivitiesCount = 2 }: TopbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-[#151F2A] border-b border-[#30404E] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Organización y Moneda */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202C39] border border-[#30404E] text-xs">
          <Building className="w-4 h-4 text-[#28B8AA]" />
          <span className="font-medium text-[#F4F7FA] hidden sm:inline">{user.organization_name}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#28B8AA]/20 text-[#28B8AA]">
            {user.currency}
          </span>
        </div>

        <div className="hidden lg:flex items-center text-xs text-[#A5B2C1]">
          <span>Zona: <strong className="text-[#F4F7FA]">{user.timezone}</strong></span>
        </div>
      </div>

      {/* Barra de Búsqueda Global */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tratos, clientes, prospectos... (Ctrl + K)"
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA] transition-colors"
          />
        </div>
      </div>

      {/* Acciones de Usuario y Notificaciones */}
      <div className="flex items-center gap-3">
        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA] hover:border-[#28B8AA] border border-[#30404E] transition-colors"
            title="Actividades y Alertas"
            aria-label="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadActivitiesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0B454] text-[#0B1118] text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadActivitiesCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#151F2A] border border-[#30404E] rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#30404E]">
                <span className="text-xs font-semibold text-[#F4F7FA]">Actividades Pendientes</span>
                <span className="text-[10px] bg-[#F0B454]/20 text-[#F0B454] px-2 py-0.5 rounded font-bold">
                  {unreadActivitiesCount} urgentes
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#202C39] border-l-2 border-[#F0B454]">
                  <p className="font-semibold text-[#F4F7FA]">Llamada con Roberto Gómez</p>
                  <p className="text-[11px] text-[#A5B2C1] mt-0.5">Seguimiento de cotización TechSolutions</p>
                  <span className="text-[10px] text-[#F0B454] font-medium mt-1 inline-block">Vence hoy a las 16:00</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#202C39] border-l-2 border-[#28B8AA]">
                  <p className="font-semibold text-[#F4F7FA]">Cierre contractual Corporación Favorita</p>
                  <p className="text-[11px] text-[#A5B2C1] mt-0.5">Reunión con Andrés Noboa</p>
                  <span className="text-[10px] text-[#28B8AA] font-medium mt-1 inline-block">Mañana 10:00</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menú de Perfil */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg bg-[#202C39] border border-[#30404E] hover:border-[#28B8AA] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#28B8AA]/20 text-[#28B8AA] font-bold text-xs flex items-center justify-center">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#F4F7FA] leading-tight">{user.full_name}</span>
              <span className="text-[10px] text-[#A5B2C1] uppercase tracking-wider">{user.role}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#151F2A] border border-[#30404E] rounded-xl shadow-2xl p-3 z-50">
              <div className="pb-3 border-b border-[#30404E]">
                <p className="text-xs font-bold text-[#F4F7FA]">{user.full_name}</p>
                <p className="text-[11px] text-[#A5B2C1] truncate">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] text-[10px] font-bold">
                  <Shield className="w-3 h-3" />
                  Rol: {user.role.toUpperCase()}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F17474] hover:bg-[#F17474]/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión Segura
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
