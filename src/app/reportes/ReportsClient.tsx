'use client';

import React, { useState, useEffect } from 'react';
import {
  Opportunity,
  Client,
  PipelineStage,
  Quote,
  Profile,
  Activity,
  SessionUser,
  AuditLog,
} from '@/types/database';
import {
  BarChart3,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Zap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { runAutomationsAction } from '@/app/actions/automations';

interface ReportsClientProps {
  opportunities: Opportunity[];
  clients: Client[];
  stages: PipelineStage[];
  quotes: Quote[];
  users: Profile[];
  activities: Activity[];
  auditLogs: AuditLog[];
  currentUser: SessionUser;
}

export function ReportsClient({
  opportunities,
  clients,
  stages,
  quotes,
  users,
  activities,
  auditLogs,
  currentUser,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'oportunidades' | 'vendedores' | 'clientes' | 'automatizaciones'>('oportunidades');
  const [selectedUser, setSelectedUser] = useState<string>('todos');
  const [timeFilter, setTimeFilter] = useState<'todos' | 'mes' | 'anio'>('todos');
  const [mounted, setMounted] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const wonStageIds = stages.filter((s) => s.is_won).map((s) => s.id);
  const lostStageIds = stages.filter((s) => s.is_lost).map((s) => s.id);

  // Filtrado de oportunidades
  const filteredOpps = opportunities.filter((o) => {
    const matchesUser = selectedUser === 'todos' || o.assigned_to === selectedUser;
    let matchesTime = true;
    if (timeFilter === 'mes') {
      const oppDate = new Date(o.created_at);
      const now = new Date();
      matchesTime = oppDate.getMonth() === now.getMonth() && oppDate.getFullYear() === now.getFullYear();
    } else if (timeFilter === 'anio') {
      const oppDate = new Date(o.created_at);
      matchesTime = oppDate.getFullYear() === 2026;
    }
    return matchesUser && matchesTime;
  });

  // Métricas agregadas
  const totalFiltrado = filteredOpps.reduce((acc, o) => acc + Number(o.expected_value), 0);
  const totalGanado = filteredOpps
    .filter((o) => wonStageIds.includes(o.stage_id))
    .reduce((acc, o) => acc + Number(o.expected_value), 0);
  const totalPerdido = filteredOpps
    .filter((o) => lostStageIds.includes(o.stage_id))
    .reduce((acc, o) => acc + Number(o.expected_value), 0);
  const wonCount = filteredOpps.filter((o) => wonStageIds.includes(o.stage_id)).length;
  const lostCount = filteredOpps.filter((o) => lostStageIds.includes(o.stage_id)).length;
  const closedCount = wonCount + lostCount;
  const tasaConversion = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const ticketPromedio = filteredOpps.length > 0 ? Math.round(totalFiltrado / filteredOpps.length) : 0;

  // Datos para Reporte por Asesor Comercial
  const repsReport = users
    .filter((u) => u.role === 'vendedor' || u.role === 'gerente' || u.role === 'admin')
    .map((user) => {
      const userOpps = opportunities.filter((o) => o.assigned_to === user.id);
      const userWon = userOpps.filter((o) => wonStageIds.includes(o.stage_id));
      const userLost = userOpps.filter((o) => lostStageIds.includes(o.stage_id));
      const wonValue = userWon.reduce((acc, o) => acc + Number(o.expected_value), 0);
      const openValue = userOpps
        .filter((o) => !wonStageIds.includes(o.stage_id) && !lostStageIds.includes(o.stage_id))
        .reduce((acc, o) => acc + Number(o.expected_value), 0);
      const userClosed = userWon.length + userLost.length;
      const winRate = userClosed > 0 ? Math.round((userWon.length / userClosed) * 100) : 0;
      const completedActs = activities.filter((a) => a.assigned_to === user.id && a.status === 'completada').length;

      return {
        id: user.id,
        nombre: user.full_name,
        email: user.email,
        rol: user.role,
        totalOpps: userOpps.length,
        ganadas: userWon.length,
        valorGanado: wonValue,
        valorPipeline: openValue,
        efectividad: winRate,
        actividades: completedActs,
      };
    });

  // Datos para Reporte de Cartera / Clientes Top
  const clientsReport = clients.map((c) => {
    const clientOpps = opportunities.filter((o) => o.client_id === c.id);
    const clientQuotes = quotes.filter((q) => q.client_id === c.id);
    const totalWon = clientOpps
      .filter((o) => wonStageIds.includes(o.stage_id))
      .reduce((acc, o) => acc + Number(o.expected_value), 0);
    const totalFacturadoCotizaciones = clientQuotes
      .filter((q) => q.status === 'aceptada')
      .reduce((acc, q) => acc + Number(q.grand_total), 0);

    return {
      id: c.id,
      nombre: c.name,
      identificacion: `${c.identification_type}: ${c.identification_number}`,
      ciudad: c.city || 'Ecuador',
      totalOportunidades: clientOpps.length,
      totalCotizaciones: clientQuotes.length,
      totalGanadoUSD: totalWon,
      totalFacturadoUSD: totalFacturadoCotizaciones,
      totalNegocio: Math.max(totalWon, totalFacturadoCotizaciones),
    };
  }).sort((a, b) => b.totalNegocio - a.totalNegocio);

  // Función de Exportación a CSV con codificación UTF-8 BOM
  const exportToCsv = (filename: string, rows: (string | number)[][], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((item) => {
            const str = String(item ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\r\n');

    // \uFEFF añade el Byte Order Mark para que Excel abra acentos y ñ sin problemas
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOpps = () => {
    const headers = ['Título Oportunidad', 'Cliente', 'Asesor', 'Etapa', 'Valor (USD)', 'Probabilidad %', 'Fecha Cierre'];
    const rows = filteredOpps.map((o) => {
      const c = clients.find((cli) => cli.id === o.client_id);
      const u = users.find((usr) => usr.id === o.assigned_to);
      const s = stages.find((stg) => stg.id === o.stage_id);
      return [
        o.title,
        c?.name || 'N/A',
        u?.full_name || 'N/A',
        s?.name || 'N/A',
        o.expected_value,
        `${o.probability}%`,
        o.expected_close_date,
      ];
    });
    exportToCsv('reporte-oportunidades-ventas', rows, headers);
  };

  const handleExportReps = () => {
    const headers = ['Asesor Comercial', 'Rol', 'Tratos Asignados', 'Ganadas', 'Ventas Ganadas (USD)', 'Pipeline Abierto (USD)', 'Tasa Conversión %', 'Actividades'];
    const rows = repsReport.map((r) => [
      r.nombre,
      r.rol,
      r.totalOpps,
      r.ganadas,
      r.valorGanado,
      r.valorPipeline,
      `${r.efectividad}%`,
      r.actividades,
    ]);
    exportToCsv('reporte-rendimiento-vendedores', rows, headers);
  };

  const handleExportClients = () => {
    const headers = ['Cliente', 'Identificación', 'Ciudad', 'Oportunidades', 'Cotizaciones', 'Total Ganado (USD)', 'Total Facturado Cotizaciones (USD)'];
    const rows = clientsReport.map((c) => [
      c.nombre,
      c.identificacion,
      c.ciudad,
      c.totalOportunidades,
      c.totalCotizaciones,
      c.totalGanadoUSD,
      c.totalFacturadoUSD,
    ]);
    exportToCsv('reporte-cartera-clientes-top', rows, headers);
  };

  const handleRunAutomations = async () => {
    setAutomating(true);
    setFeedback(null);
    try {
      const res = await runAutomationsAction();
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Motor ejecutado correctamente.' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al ejecutar motor.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión con el motor.' });
    } finally {
      setAutomating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Centro de Reportes y Analítica</h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              Fase 5: Inteligencia Comercial
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Métricas de rendimiento, análisis de conversión y exportación consolidada en formato CSV universal.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1.5 p-1 bg-[#151F2A] rounded-xl border border-[#30404E] overflow-x-auto self-start sm:self-auto">
          {[
            { id: 'oportunidades', label: 'Ventas y Oportunidades', icon: TrendingUp },
            { id: 'vendedores', label: 'Rendimiento por Asesor', icon: Users },
            { id: 'clientes', label: 'Cartera y Clientes Top', icon: Building2 },
            { id: 'automatizaciones', label: 'Automatizaciones', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-[#28B8AA] text-[#0B1118] shadow-md shadow-[#28B8AA]/20'
                    : 'text-[#A5B2C1] hover:text-[#F4F7FA] hover:bg-[#202C39]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[#34C48A]/10 text-[#34C48A] border-[#34C48A]/30'
              : 'bg-[#F17474]/10 text-[#F17474] border-[#F17474]/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-xs opacity-70">
            ✕
          </button>
        </div>
      )}

      {/* PESTAÑA 1: REPORTE DE VENTAS Y OPORTUNIDADES */}
      {activeTab === 'oportunidades' && (
        <div className="space-y-6">
          {/* Barra de Filtros y Exportación */}
          <div className="crm-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-[#A5B2C1]">
                <Filter className="w-3.5 h-3.5 text-[#28B8AA]" />
                <span className="font-semibold">Asesor:</span>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="crm-input text-xs py-1"
                >
                  <option value="todos">Todos los Asesores</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#A5B2C1]">
                <Calendar className="w-3.5 h-3.5 text-[#28B8AA]" />
                <span className="font-semibold">Periodo:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="crm-input text-xs py-1"
                >
                  <option value="todos">Todo el Histórico</option>
                  <option value="mes">Mes en Curso</option>
                  <option value="anio">Año 2026</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportOpps}
              className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Reporte a CSV</span>
            </button>
          </div>

          {/* Tarjetas KPI del Reporte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="crm-card p-4">
              <span className="text-[11px] text-[#A5B2C1]">Total Oportunidades</span>
              <p className="text-xl font-bold font-mono text-[#F4F7FA] mt-1">
                {formatUSD(totalFiltrado)}
              </p>
              <span className="text-[10px] text-[#A5B2C1]">{filteredOpps.length} tratos evaluados</span>
            </div>

            <div className="crm-card p-4">
              <span className="text-[11px] text-[#A5B2C1]">Ventas Ganadas</span>
              <p className="text-xl font-bold font-mono text-[#34C48A] mt-1">
                {formatUSD(totalGanado)}
              </p>
              <span className="text-[10px] text-[#34C48A]">{wonCount} cierres confirmados</span>
            </div>

            <div className="crm-card p-4">
              <span className="text-[11px] text-[#A5B2C1]">Tasa de Conversión</span>
              <p className="text-xl font-bold font-mono text-[#28B8AA] mt-1">
                {tasaConversion}%
              </p>
              <span className="text-[10px] text-[#A5B2C1]">De {closedCount} decisiones finales</span>
            </div>

            <div className="crm-card p-4">
              <span className="text-[11px] text-[#A5B2C1]">Ticket Promedio</span>
              <p className="text-xl font-bold font-mono text-[#F0B454] mt-1">
                {formatUSD(ticketPromedio)}
              </p>
              <span className="text-[10px] text-[#A5B2C1]">Por oportunidad en cartera</span>
            </div>
          </div>

          {/* Tabla Detallada */}
          <div className="crm-card overflow-hidden">
            <div className="p-4 border-b border-[#30404E] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F4F7FA]">
                Detalle de Oportunidades ({filteredOpps.length})
              </h2>
              <span className="text-xs text-[#A5B2C1]">Orden cronológico</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Oportunidad</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Asesor</th>
                    <th className="py-3 px-4">Etapa</th>
                    <th className="py-3 px-4 text-right">Valor Proyectado</th>
                    <th className="py-3 px-4 text-center">Probabilidad</th>
                    <th className="py-3 px-4 text-right">Cierre Previsto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30404E]/50">
                  {filteredOpps.map((opp) => {
                    const c = clients.find((cli) => cli.id === opp.client_id);
                    const u = users.find((usr) => usr.id === opp.assigned_to);
                    const s = stages.find((stg) => stg.id === opp.stage_id);

                    return (
                      <tr key={opp.id} className="hover:bg-[#202C39]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#F4F7FA]">{opp.title}</td>
                        <td className="py-3 px-4 text-[#A5B2C1]">{c?.name || 'Cliente'}</td>
                        <td className="py-3 px-4 text-[#A5B2C1]">{u?.full_name || 'Sin asignar'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s?.is_won
                                ? 'bg-[#34C48A]/15 text-[#34C48A]'
                                : s?.is_lost
                                ? 'bg-[#F17474]/15 text-[#F17474]'
                                : 'bg-[#28B8AA]/15 text-[#28B8AA]'
                            }`}
                          >
                            {s?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#F4F7FA]">
                          {formatUSD(opp.expected_value)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#A5B2C1]">{opp.probability}%</td>
                        <td className="py-3 px-4 text-right text-[#A5B2C1]">{opp.expected_close_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: RENDIMIENTO POR ASESOR COMERCIAL */}
      {activeTab === 'vendedores' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#F4F7FA]">Evaluación del Equipo de Ventas</h2>
              <p className="text-xs text-[#A5B2C1]">Cierres monetarios, tasa de efectividad y actividades ejecutadas</p>
            </div>
            <button
              onClick={handleExportReps}
              className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Asesores a CSV</span>
            </button>
          </div>

          <div className="crm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Asesor Comercial</th>
                    <th className="py-3 px-4">Rol en Sistema</th>
                    <th className="py-3 px-4 text-center">Tratos Asignados</th>
                    <th className="py-3 px-4 text-center">Ganados</th>
                    <th className="py-3 px-4 text-right">Ventas Ganadas</th>
                    <th className="py-3 px-4 text-right">Pipeline Activo</th>
                    <th className="py-3 px-4 text-center">Efectividad %</th>
                    <th className="py-3 px-4 text-center">Tareas Hechas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30404E]/50">
                  {repsReport.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#202C39]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#F4F7FA]">
                        <div>{rep.nombre}</div>
                        <div className="text-[10px] text-[#A5B2C1]">{rep.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-[#202C39] border border-[#30404E] text-[#A5B2C1]">
                          {rep.rol}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">{rep.totalOpps}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-[#34C48A] font-bold">
                        {rep.ganadas}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#34C48A]">
                        {formatUSD(rep.valorGanado)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#28B8AA]">
                        {formatUSD(rep.valorPipeline)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-[#28B8AA]">
                          {rep.efectividad}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[#F0B454]">
                        {rep.actividades}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CARTERA Y TOP CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#F4F7FA]">Ranking de Cartera de Clientes</h2>
              <p className="text-xs text-[#A5B2C1]">Cuentas comerciales ordenadas por volumen de facturación y proyectos</p>
            </div>
            <button
              onClick={handleExportClients}
              className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Clientes a CSV</span>
            </button>
          </div>

          <div className="crm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Razón Social</th>
                    <th className="py-3 px-4">Identificación</th>
                    <th className="py-3 px-4">Ciudad</th>
                    <th className="py-3 px-4 text-center">Tratos</th>
                    <th className="py-3 px-4 text-center">Cotizaciones</th>
                    <th className="py-3 px-4 text-right">Total Ganado</th>
                    <th className="py-3 px-4 text-right">Cotizado Aceptado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30404E]/50">
                  {clientsReport.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#202C39]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#A5B2C1]">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-[#F4F7FA]">{c.nombre}</td>
                      <td className="py-3 px-4 text-[10px] font-mono text-[#A5B2C1]">{c.identificacion}</td>
                      <td className="py-3 px-4 text-[#A5B2C1]">{c.ciudad}</td>
                      <td className="py-3 px-4 text-center font-mono">{c.totalOportunidades}</td>
                      <td className="py-3 px-4 text-center font-mono">{c.totalCotizaciones}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#34C48A]">
                        {formatUSD(c.totalGanadoUSD)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#28B8AA]">
                        {formatUSD(c.totalFacturadoUSD)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: MOTOR DE AUTOMATIZACIONES Y AUDITORÍA */}
      {activeTab === 'automatizaciones' && (
        <div className="space-y-6">
          <div className="crm-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#28B8AA]/30 bg-[#28B8AA]/5">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#28B8AA]" />
                <h2 className="text-base font-bold text-[#F4F7FA]">Motor de Reglas y Automatizaciones Comerciales</h2>
              </div>
              <p className="text-xs text-[#A5B2C1] mt-1 max-w-xl leading-relaxed">
                Ejecuta comprobaciones inteligentes sobre el CRM: detecta oportunidades desatendidas para crear tareas prioritarias de rescate y actualiza automáticamente cotizaciones expiradas.
              </p>
            </div>

            <button
              onClick={handleRunAutomations}
              disabled={automating}
              className="crm-button-primary text-xs py-2.5 px-5 flex items-center gap-2 shrink-0"
            >
              {automating ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-[#0B1118] rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{automating ? 'Analizando CRM...' : 'Ejecutar Reglas Ahora'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="crm-card p-5 space-y-2">
              <span className="text-xs font-bold text-[#28B8AA] uppercase tracking-wider block">Regla Activa 1</span>
              <h3 className="text-sm font-bold text-[#F4F7FA]">Protección de Oportunidades Estancadas</h3>
              <p className="text-xs text-[#A5B2C1] leading-relaxed">
                Si un trato en fase de calificación o propuesta no registra actividad pendiente, el motor genera automáticamente una tarea de tipo llamada al asesor responsable con prioridad alta.
              </p>
            </div>

            <div className="crm-card p-5 space-y-2">
              <span className="text-xs font-bold text-[#F0B454] uppercase tracking-wider block">Regla Activa 2</span>
              <h3 className="text-sm font-bold text-[#F4F7FA]">Caducidad de Ofertas Comerciales</h3>
              <p className="text-xs text-[#A5B2C1] leading-relaxed">
                Las cotizaciones cuya fecha de validez (<code>valid_until</code>) haya sido superada se actualizan automáticamente de estado a &quot;vencida&quot;, garantizando que los precios no queden abiertos indebidamente.
              </p>
            </div>
          </div>

          {/* Historial de Auditoría en Vivo */}
          <div className="crm-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
              <h3 className="text-sm font-bold text-[#F4F7FA]">Bitácora Reciente de Auditoría y Eventos</h3>
              <span className="text-[10px] text-[#A5B2C1]">{auditLogs.length} eventos registrados</span>
            </div>

            <div className="space-y-2 text-xs">
              {auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <span className="font-mono font-bold text-[11px] text-[#28B8AA] mr-2">
                      [{log.action}]
                    </span>
                    <span className="text-[#F4F7FA]">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-[#A5B2C1] shrink-0">
                    {new Date(log.created_at).toLocaleString('es-EC')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
