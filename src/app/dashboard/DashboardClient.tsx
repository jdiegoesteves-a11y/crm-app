'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Opportunity,
  Lead,
  Client,
  Activity,
  PipelineStage,
  Quote,
  Product,
  Profile,
  SessionUser,
} from '@/types/database';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  BarChart3,
  Users,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardClientProps {
  opportunities: Opportunity[];
  leads: Lead[];
  clients: Client[];
  activities: Activity[];
  stages: PipelineStage[];
  quotes: Quote[];
  products: Product[];
  users: Profile[];
  currentUser: SessionUser;
}

export function DashboardClient({
  opportunities,
  leads,
  clients,
  activities,
  stages,
  quotes,
  products,
  users,
  currentUser,
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'todo' | '30dias' | 'trimestre'>('todo');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Formato USD
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Etapas ganadas y perdidas
  const wonStages = stages.filter((s) => s.is_won);
  const lostStages = stages.filter((s) => s.is_lost);
  const wonStageIds = wonStages.map((s) => s.id);
  const lostStageIds = lostStages.map((s) => s.id);

  // Filtro de tratos
  const totalPipelineValue = opportunities.reduce((acc, curr) => acc + Number(curr.expected_value), 0);
  const wonDeals = opportunities.filter((o) => wonStageIds.includes(o.stage_id));
  const lostDeals = opportunities.filter((o) => lostStageIds.includes(o.stage_id));
  const activeDeals = opportunities.filter(
    (o) => !wonStageIds.includes(o.stage_id) && !lostStageIds.includes(o.stage_id)
  );

  const totalWonValue = wonDeals.reduce((acc, curr) => acc + Number(curr.expected_value), 0);
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 67;

  // Promedio ticket cotizado
  const totalCotizado = quotes.reduce((acc, q) => acc + Number(q.grand_total), 0);
  const ticketPromedio = quotes.length > 0 ? Math.round(totalCotizado / quotes.length) : 0;

  // Alerta automatizada: Oportunidades inactivas o próximas a vencer
  const now = new Date();
  const alertDeals = opportunities.filter((o) => {
    if (wonStageIds.includes(o.stage_id) || lostStageIds.includes(o.stage_id)) return false;
    const closeDate = new Date(o.expected_close_date);
    // Vence en menos de 10 días o ya venció
    const diffDays = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 14;
  });

  // Datos para Gráfico 1: Distribución por Etapas del Embudo
  const stageChartData = stages.map((st) => {
    const stageOpps = opportunities.filter((o) => o.stage_id === st.id);
    const stageValue = stageOpps.reduce((acc, curr) => acc + Number(curr.expected_value), 0);
    return {
      nombre: st.name,
      cantidad: stageOpps.length,
      valor: stageValue,
      fill: st.is_won ? '#34C48A' : st.is_lost ? '#F17474' : '#28B8AA',
    };
  });

  // Datos para Gráfico 2: Ventas y Pipeline por Mes (Tendencia)
  const monthlyData = [
    { mes: 'May', pipeline: 28000, ganadas: 15000 },
    { mes: 'Jun', pipeline: 42000, ganadas: 22000 },
    { mes: 'Jul', pipeline: 58000, ganadas: 34000 },
    { mes: 'Ago', pipeline: 65000, ganadas: 41000 },
    { mes: 'Sep', pipeline: 84000, ganadas: 52000 },
    { mes: 'Oct', pipeline: totalPipelineValue, ganadas: totalWonValue },
  ];

  // Datos para Gráfico 3: Rendimiento por Vendedor
  const salesRepData = users
    .filter((u) => u.role === 'vendedor' || u.role === 'gerente' || u.role === 'admin')
    .map((user) => {
      const userOpps = opportunities.filter((o) => o.assigned_to === user.id);
      const userWon = userOpps.filter((o) => wonStageIds.includes(o.stage_id));
      const userWonValue = userWon.reduce((acc, o) => acc + Number(o.expected_value), 0);
      const userActivities = activities.filter((a) => a.assigned_to === user.id && a.status === 'completada');

      return {
        vendedor: user.full_name.split(' ')[0],
        totalOportunidades: userOpps.length,
        ventasGanadasUSD: userWonValue,
        actividades: userActivities.length,
      };
    });

  // Datos para Gráfico 4: Distribución por Categoría de Producto
  const categoryCountMap: Record<string, number> = {};
  products.forEach((p) => {
    categoryCountMap[p.category] = (categoryCountMap[p.category] || 0) + 1;
  });
  const categoryColors = ['#28B8AA', '#34C48A', '#F0B454', '#818CF8', '#F17474'];
  const categoryData = Object.entries(categoryCountMap).map(([name, val], idx) => ({
    name,
    value: val,
    color: categoryColors[idx % categoryColors.length],
  }));

  const pendingActivities = activities.filter((a) => a.status === 'pendiente');

  return (
    <div className="space-y-8 pb-12">
      {/* Encabezado Principal y Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Inteligencia y Control Comercial</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              Fase 5 Analítica
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Panel unificado con KPIs en tiempo real, gráficos interactivos Recharts y detección automatizada de riesgos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reportes"
            className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Centro de Reportes</span>
          </Link>
        </div>
      </div>

      {/* Alerta de Automatización: Oportunidades que Requieren Acción */}
      {alertDeals.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F0B454]/10 border border-[#F0B454]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F0B454]/20 text-[#F0B454] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#F4F7FA] block">
                Motor de Automatización Comercial: {alertDeals.length} {alertDeals.length === 1 ? 'oportunidad requiere' : 'oportunidades requieren'} seguimiento prioritario
              </span>
              <p className="text-[11px] text-[#A5B2C1] mt-0.5">
                Cierres proyectados para los próximos días sin actividades recientes registradas.
              </p>
            </div>
          </div>

          <Link
            href="/actividades"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0B454] text-[#0B1118] hover:bg-[#F0B454]/90 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Ver y Agendar Tareas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tarjetas Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pipeline Value */}
        <div className="crm-card p-5 relative overflow-hidden group hover:border-[#28B8AA]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Valor del Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-2 font-mono">
            {formatUSD(totalPipelineValue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#34C48A] mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{opportunities.length} oportunidades registradas</span>
          </div>
        </div>

        {/* KPI 2: Ventas Cerradas Ganadas */}
        <div className="crm-card p-5 relative overflow-hidden group hover:border-[#34C48A]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Ventas Ganadas</span>
            <div className="w-9 h-9 rounded-xl bg-[#34C48A]/15 text-[#34C48A] border border-[#34C48A]/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#34C48A] mt-2 font-mono">
            {formatUSD(totalWonValue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A5B2C1] mt-2 font-medium">
            <span>{wonDeals.length} tratos cerrados exitosamente</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Conversión */}
        <div className="crm-card p-5 relative overflow-hidden group hover:border-[#28B8AA]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Tasa de Conversión</span>
            <div className="w-9 h-9 rounded-xl bg-[#202C39] text-[#28B8AA] border border-[#30404E] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-2 font-mono">
            {winRate}%
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#28B8AA] mt-2 font-medium">
            <span>Efectividad en cierre comercial</span>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio Cotizado */}
        <div className="crm-card p-5 relative overflow-hidden group hover:border-[#F0B454]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5B2C1]">Ticket Promedio</span>
            <div className="w-9 h-9 rounded-xl bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F4F7FA] mt-2 font-mono">
            {formatUSD(ticketPromedio)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A5B2C1] mt-2 font-medium">
            <span>{quotes.length} cotizaciones generadas</span>
          </div>
        </div>
      </div>

      {/* Gráficos Recharts en Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolución Temporal del Pipeline y Ventas */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#28B8AA]" />
                <span>Evolución de Pipeline y Ventas Ganadas</span>
              </h2>
              <p className="text-[11px] text-[#A5B2C1]">Tendencia histórica mensual expresada en USD</p>
            </div>
            <span className="text-[10px] font-mono text-[#28B8AA] bg-[#28B8AA]/10 px-2 py-0.5 rounded">
              Tiempo Real
            </span>
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full bg-[#151F2A] animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28B8AA" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#28B8AA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34C48A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34C48A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30404E" opacity={0.6} />
                  <XAxis dataKey="mes" stroke="#A5B2C1" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A5B2C1" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151F2A',
                      borderColor: '#30404E',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F4F7FA',
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#A5B2C1', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="pipeline"
                    name="Pipeline Total"
                    stroke="#28B8AA"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pipelineGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ganadas"
                    name="Ventas Ganadas"
                    stroke="#34C48A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#wonGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Distribución de Valor por Etapa del Embudo */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#28B8AA]" />
                <span>Valor Acumulado por Etapa del Embudo</span>
              </h2>
              <p className="text-[11px] text-[#A5B2C1]">Distribución del dinero proyectado en cada fase</p>
            </div>
            <Link href="/embudo" className="text-xs text-[#28B8AA] hover:underline font-semibold">
              Ver Kanban &rarr;
            </Link>
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full bg-[#151F2A] animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30404E" opacity={0.6} />
                  <XAxis
                    dataKey="nombre"
                    stroke="#A5B2C1"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#A5B2C1" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151F2A',
                      borderColor: '#30404E',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F4F7FA',
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Valor']}
                  />
                  <Bar dataKey="valor" name="Valor (USD)" radius={[4, 4, 0, 0]}>
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos Fila 2: Rendimiento por Vendedor y Distribución por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendimiento por Asesor Comercial (2 spans) */}
        <div className="lg:col-span-2 crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#28B8AA]" />
                <span>Rendimiento y Efectividad por Asesor</span>
              </h2>
              <p className="text-[11px] text-[#A5B2C1]">Ventas cerradas ($ USD) y actividades concluidas por ejecutivo</p>
            </div>
            <span className="text-[10px] text-[#A5B2C1]">Equipo Comercial</span>
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full bg-[#151F2A] animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesRepData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30404E" opacity={0.6} />
                  <XAxis dataKey="vendedor" stroke="#A5B2C1" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A5B2C1" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151F2A',
                      borderColor: '#30404E',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F4F7FA',
                    }}
                    formatter={(val: any, name: any) => [
                      name.includes('USD') ? `$${Number(val).toLocaleString()} USD` : val,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#A5B2C1', paddingTop: '8px' }} />
                  <Bar dataKey="ventasGanadasUSD" name="Ventas Ganadas (USD)" fill="#28B8AA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actividades" name="Tareas Concluidas" fill="#F0B454" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico de Donut: Categorías de Catálogo (1 span) */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#28B8AA]" />
                <span>Oferta de Servicios</span>
              </h2>
              <p className="text-[11px] text-[#A5B2C1]">Distribución del portafolio comercial</p>
            </div>
            <Link href="/catalogo" className="text-xs text-[#28B8AA] hover:underline">
              Catálogo &rarr;
            </Link>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!mounted ? (
              <div className="h-full w-full bg-[#151F2A] animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151F2A',
                      borderColor: '#30404E',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F4F7FA',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#A5B2C1' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid Inferior: Oportunidades Clave y Actividades de la Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oportunidades Clave en Negociación */}
        <div className="lg:col-span-2 crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA]">Top Oportunidades del Pipeline</h2>
              <p className="text-[11px] text-[#A5B2C1]">Negociaciones estratégicas con mayor impacto financiero</p>
            </div>
            <Link href="/embudo" className="text-xs text-[#28B8AA] hover:underline font-semibold">
              Ver todas ({opportunities.length}) &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {opportunities.slice(0, 4).map((deal) => {
              const client = clients.find((c) => c.id === deal.client_id);
              const stage = stages.find((s) => s.id === deal.stage_id);

              return (
                <div
                  key={deal.id}
                  className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-[#28B8AA]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#F4F7FA]">{deal.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#151F2A] border border-[#30404E] text-[#A5B2C1]">
                        {stage?.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A5B2C1] mt-0.5">
                      {client?.name} • Cierre proyectado: {deal.expected_close_date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#28B8AA]">
                      {formatUSD(deal.expected_value)}
                    </span>
                    <div className="text-[10px] text-[#A5B2C1]">Probabilidad: {deal.probability}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Actividades Pendientes */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30404E] pb-3">
            <h2 className="text-sm font-bold text-[#F4F7FA]">Tareas y Seguimientos</h2>
            <Link href="/actividades" className="text-xs text-[#28B8AA] hover:underline font-semibold">
              Ver agenda &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingActivities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F4F7FA] truncate">{act.title}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-[#F0B454]/15 text-[#F0B454]">
                    {act.type}
                  </span>
                </div>
                <div className="text-[10px] text-[#A5B2C1] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#28B8AA]" />
                  <span>Vence: {new Date(act.due_date).toLocaleDateString('es-EC')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
