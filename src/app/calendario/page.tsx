import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';


export default async function CalendarioPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Calendario Comercial</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 3 Productividad
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Vistas mensual, semanal y diaria con sincronización de compromisos comerciales.
          </p>
        </div>

        <div className="crm-card p-12 text-center">
          <Calendar className="w-12 h-12 text-[#28B8AA] mx-auto mb-4" />
          <h2 className="text-base font-bold text-[#F4F7FA]">Módulo de Calendario Comercial</h2>
          <p className="text-xs text-[#A5B2C1] max-w-md mx-auto mt-2 leading-relaxed">
            Programado para construcción integral en la <strong>Fase 3 (Productividad)</strong>. Incluirá vistas dinámicas, sincronización con tareas y soporte opcional de Google Calendar bajo su expresa aprobación.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
