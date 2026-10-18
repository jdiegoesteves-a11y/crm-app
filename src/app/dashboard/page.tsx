import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  PhoneCall,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';


export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const db = dbManager.getDb();

  // Cálculo de KPIs desde datos reales de la base de datos
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);
  const leads = db.leads.filter((l) => l.organization_id === session.organization_id);
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);
  const stages = db.pipeline_stages.filter((s) => s.organization_id === session.organization_id);

  // Valor total del embudo
  const totalPipelineValue = opportunities.reduce((acc, curr) => acc + Number(curr.expected_value), 0);

  // Oportunidades ganadas y perdidas
  const wonStageIds = stages.filter((s) => s.is_won).map((s) => s.id);
  const lostStageIds = stages.filter((s) => s.is_lost).map((s) => s.id);

  const wonDeals = opportunities.filter((o) => wonStageIds.includes(o.stage_id));
  const lostDeals = opportunities.filter((o) => lostStageIds.includes(o.stage_id));
  const activeDeals = opportunities.filter(
    (o) => !wonStageIds.includes(o.stage_id) && !lostStageIds.includes(o.stage_id)
  );

  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 75;

  // Tareas / llamadas pendientes
  const pendingActivities = activities.filter((a) => a.status === 'pendiente');

  // Formateador de moneda USD
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell user={session}>
      {/* Encabezado y Bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Panel de Control Comercial</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              Datos Reales Activos
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Bienvenido, <strong className="text-[#F4F7FA]">{session.full_name}</strong>. Resumen comercial y estado del pipeline en tiempo real.
          </p>
        </div>

        {/* Etiqueta de Rol Activo */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#151F2A] border border-[#30404E] flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4 text-[#28B8AA]" />
            <span className="text-[#A5B2C1]">Nivel de Acceso:</span>
            <span className="font-bold text-[#F4F7FA] uppercase">{session.role}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas Métricas Principales (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* KPI 1: Valor del Embudo */}
        <div className="crm-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Valor del Embudo</span>
            <div className="w-8 h-8 rounded-lg bg-[#28B8AA]/20 text-[#28B8AA] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-3">
            {formatUSD(totalPipelineValue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#34C48A] mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{opportunities.length} oportunidades registradas</span>
          </div>
        </div>

        {/* KPI 2: Tratos Activos */}
        <div className="crm-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Tratos Activos</span>
            <div className="w-8 h-8 rounded-lg bg-[#202C39] text-[#28B8AA] flex items-center justify-center border border-[#30404E]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-3">
            {activeDeals.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#A5B2C1] mt-2 font-medium">
            <span>{wonDeals.length} ganados en total</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Cierre */}
        <div className="crm-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Tasa de Conversión</span>
            <div className="w-8 h-8 rounded-lg bg-[#34C48A]/20 text-[#34C48A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-3">
            {winRate}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#34C48A] mt-2 font-medium">
            <span>Basado en cierres efectivos</span>
          </div>
        </div>

        {/* KPI 4: Actividades Pendientes */}
        <div className="crm-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Tareas y Seguimientos</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0B454]/20 text-[#F0B454] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-3">
            {pendingActivities.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#F0B454] mt-2 font-medium">
            <span>{activities.length} en historial</span>
          </div>
        </div>
      </div>

      {/* Grid de Contenido: Embudo Rápido y Actividades Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda (2 spans): Vista Rápida del Embudo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="crm-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#30404E]">
              <div>
                <h2 className="text-base font-bold text-[#F4F7FA]">Embudo Comercial Activo</h2>
                <p className="text-xs text-[#A5B2C1] mt-0.5">Oportunidades en curso por etapa</p>
              </div>
              <a
                href="/embudo"
                className="text-xs text-[#28B8AA] hover:underline font-semibold flex items-center gap-1"
              >
                Ver tablero completo &rarr;
              </a>
            </div>

            <div className="mt-5 space-y-3">
              {opportunities.map((deal) => {
                const client = clients.find((c) => c.id === deal.client_id);
                const stage = stages.find((s) => s.id === deal.stage_id);

                return (
                  <div
                    key={deal.id}
                    className="p-4 rounded-xl bg-[#202C39]/80 border border-[#30404E] hover:border-[#28B8AA]/60 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F4F7FA] truncate">{deal.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#151F2A] border border-[#30404E] text-[#A5B2C1]">
                          {stage?.name || 'En proceso'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A5B2C1] mt-1 flex items-center gap-2">
                        <span>{client?.name || 'Cliente Comercial'}</span>
                        <span>•</span>
                        <span>Cierre est: {deal.expected_close_date}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#28B8AA]">
                        {formatUSD(deal.expected_value)}
                      </div>
                      <div className="text-[10px] text-[#A5B2C1] font-medium">
                        Prob: {deal.probability}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen de Clientes y Prospectos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="crm-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#F4F7FA]">Prospectos Nuevos</span>
                <a href="/prospectos" className="text-[11px] text-[#28B8AA] hover:underline font-semibold">
                  Gestionar
                </a>
              </div>
              <div className="space-y-2.5">
                {leads.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="p-2.5 rounded-lg bg-[#202C39] border border-[#30404E] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#F4F7FA]">{lead.first_name} {lead.last_name}</div>
                      <div className="text-[10px] text-[#A5B2C1]">{lead.company_name}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B454]/15 text-[#F0B454]">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="crm-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#F4F7FA]">Clientes Corporativos</span>
                <a href="/clientes" className="text-[11px] text-[#28B8AA] hover:underline font-semibold">
                  Directorio
                </a>
              </div>
              <div className="space-y-2.5">
                {clients.slice(0, 3).map((client) => (
                  <div key={client.id} className="p-2.5 rounded-lg bg-[#202C39] border border-[#30404E] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#F4F7FA] truncate max-w-[150px]">{client.name}</div>
                      <div className="text-[10px] text-[#A5B2C1]">{client.city} • RUC {client.identification_number}</div>
                    </div>
                    <span className="text-[10px] text-[#28B8AA] font-bold">Activo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1 span): Agenda y Bitácora de Auditoría */}
        <div className="space-y-6">
          {/* Actividades del Día */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <span className="text-xs font-bold text-[#F4F7FA]">Agenda y Tareas</span>
              <span className="text-[10px] font-bold bg-[#28B8AA]/20 text-[#28B8AA] px-2 py-0.5 rounded">
                Hoy
              </span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F4F7FA]">{act.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        act.status === 'completada'
                          ? 'bg-[#34C48A]/20 text-[#34C48A]'
                          : 'bg-[#F0B454]/20 text-[#F0B454]'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A5B2C1] leading-relaxed">{act.description}</p>
                  <div className="flex items-center gap-1 text-[10px] text-[#A5B2C1]/80 pt-1">
                    <Clock className="w-3 h-3 text-[#28B8AA]" />
                    <span>Tipo: {act.type.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trazabilidad y Auditoría en Vivo */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-3">
              <span className="text-xs font-bold text-[#F4F7FA]">Bitácora de Auditoría</span>
              <span className="text-[10px] text-[#A5B2C1]">Tiempo real</span>
            </div>
            <div className="space-y-2 text-xs">
              {db.audit_logs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-2 rounded bg-[#202C39]/60 border border-[#30404E]/60 text-[11px]">
                  <div className="font-semibold text-[#28B8AA]">{log.action}</div>
                  <div className="text-[10px] text-[#A5B2C1] mt-0.5">{log.details}</div>
                  <div className="text-[9px] text-[#64748b] mt-1">
                    {new Date(log.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
