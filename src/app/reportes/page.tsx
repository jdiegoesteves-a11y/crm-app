import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';


export default async function ReportesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!['admin', 'gerente'].includes(session.role)) {
    redirect('/dashboard?error=no_autorizado');
  }

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Reportes y Analítica Comercial</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 5 Inteligencia
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Métricas de rendimiento por vendedor, proyecciones comerciales y exportación analítica.
          </p>
        </div>

        <div className="crm-card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[#28B8AA] mx-auto mb-4" />
          <h2 className="text-base font-bold text-[#F4F7FA]">Módulo de Inteligencia Comercial y Reportes</h2>
          <p className="text-xs text-[#A5B2C1] max-w-md mx-auto mt-2 leading-relaxed">
            Programado para implementación en la <strong>Fase 5 (Inteligencia Comercial)</strong> con gráficos interactivos Recharts, filtros temporales y exportaciones a CSV y PDF.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
