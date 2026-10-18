'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Opportunity,
  PipelineStage,
  Client,
  Contact,
  Profile,
  SessionUser,
} from '@/types/database';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Building,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import {
  createOpportunityAction,
  updateOpportunityStageAction,
  deleteOpportunityAction,
} from '@/app/actions/deals';

interface KanbanClientProps {
  initialStages: PipelineStage[];
  initialOpportunities: Opportunity[];
  clients: Client[];
  contacts: Contact[];
  users: Profile[];
  currentUser: SessionUser;
}

export function KanbanClient({
  initialStages,
  initialOpportunities,
  clients,
  contacts,
  users,
  currentUser,
}: KanbanClientProps) {
  const [stages] = useState<PipelineStage[]>(initialStages);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nueva Oportunidad
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [contactId, setContactId] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id || '');
  const [expectedValue, setExpectedValue] = useState<number>(15000);
  const [closeDate, setCloseDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Cálculo de totales
  const totalPipelineValue = opportunities.reduce((acc, curr) => acc + Number(curr.expected_value), 0);

  // Filtrado
  const filteredDeals = opportunities.filter((deal) => {
    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === deal.client_id);
    const clientName = client ? client.name.toLowerCase() : '';

    const matchesSearch =
      deal.title.toLowerCase().includes(term) || clientName.includes(term);

    const matchesAssigned =
      assignedFilter === 'todos' || deal.assigned_to === assignedFilter;

    return matchesSearch && matchesAssigned;
  });

  // Drag and Drop Nativo de Alto Rendimiento
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = draggedDealId || e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    const deal = opportunities.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === targetStageId) return;

    // Actualización optimista inmediata
    const targetStage = stages.find((s) => s.id === targetStageId);
    setOpportunities((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, stage_id: targetStageId, probability: targetStage?.probability ?? d.probability }
          : d
      )
    );
    setDraggedDealId(null);

    // Persistencia en base de datos
    const res = await updateOpportunityStageAction(dealId, targetStageId);
    if (res?.success) {
      setFeedback({
        type: 'success',
        text: `Oportunidad movida a [${res.newStageName}] (${res.newProbability}% prob). Guardado en base de datos.`,
      });
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al persistir el cambio de etapa.' });
      window.location.reload();
    }
  };

  const handleManualStageChange = async (dealId: string, newStageId: string) => {
    const targetStage = stages.find((s) => s.id === newStageId);
    setOpportunities((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, stage_id: newStageId, probability: targetStage?.probability ?? d.probability }
          : d
      )
    );

    const res = await updateOpportunityStageAction(dealId, newStageId);
    if (res?.success) {
      setFeedback({
        type: 'success',
        text: `Oportunidad movida a [${res.newStageName}].`,
      });
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('client_id', clientId);
    if (contactId) formData.append('contact_id', contactId);
    formData.append('stage_id', stageId);
    formData.append('expected_value', expectedValue.toString());
    formData.append('expected_close_date', closeDate);
    formData.append('assigned_to', currentUser.id);
    formData.append('notes', notes);

    const res = await createOpportunityAction(null, formData);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Oportunidad creada exitosamente.' });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al registrar oportunidad.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Embudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Embudo Comercial (Pipeline Kanban)</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              ${totalPipelineValue.toLocaleString()} USD Total
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Gestión visual con 7 etapas interactivas, arrastrar y soltar con persistencia inmediata y cálculo de probabilidades.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={clients.length === 0}
            className="crm-button-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Oportunidad</span>
          </button>
        )}
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-[#34C48A]/15 border-[#34C48A]/40 text-[#34C48A]'
              : 'bg-[#F17474]/15 border-[#F17474]/40 text-[#F17474]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="crm-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de oportunidad o empresa cliente..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#A5B2C1]">Vendedor:</span>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
          >
            <option value="todos">Todos los responsables</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tablero Kanban con las 7 Etapas */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[600px] select-none">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage_id === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.expected_value), 0);

          let stageHeaderColor = 'text-[#F4F7FA]';
          let stageGlow = 'border-[#30404E]';
          if (stage.is_won) {
            stageHeaderColor = 'text-[#34C48A]';
            stageGlow = 'border-[#34C48A]/40 bg-[#34C48A]/5';
          } else if (stage.is_lost) {
            stageHeaderColor = 'text-[#F17474]';
            stageGlow = 'border-[#F17474]/40 bg-[#F17474]/5';
          }

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 shrink-0 rounded-xl bg-[#151F2A] border ${stageGlow} flex flex-col max-h-[calc(100vh-250px)] shadow-lg transition-all`}
            >
              {/* Encabezado de Columna */}
              <div className="p-3.5 border-b border-[#30404E] bg-[#111A24]/70 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${stageHeaderColor}`}>{stage.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#202C39] text-[#28B8AA]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A5B2C1] font-semibold">{stage.probability}%</span>
                </div>
                <div className="text-[11px] font-bold text-[#28B8AA] mt-1.5">
                  ${stageTotal.toLocaleString()} USD
                </div>
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[120px]">
                {stageDeals.length === 0 ? (
                  <div className="h-28 border border-dashed border-[#30404E] rounded-lg flex items-center justify-center text-[11px] text-[#64748B]">
                    Arrastre tratos aquí
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const client = clients.find((c) => c.id === deal.client_id);
                    const assignedUser = users.find((u) => u.id === deal.assigned_to);

                    return (
                      <div
                        key={deal.id}
                        draggable={currentUser.role !== 'consulta'}
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`p-3.5 rounded-xl bg-[#202C39] border border-[#30404E] hover:border-[#28B8AA] shadow-sm transition-all cursor-grab active:cursor-grabbing group relative ${
                          draggedDealId === deal.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#F4F7FA] group-hover:text-[#28B8AA] transition-colors leading-snug">
                            {deal.title}
                          </h4>
                          <GripVertical className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#A5B2C1] shrink-0 mt-0.5" />
                        </div>

                        {client && (
                          <div className="text-[11px] text-[#A5B2C1] mt-1 flex items-center gap-1 truncate">
                            <Building className="w-3 h-3 text-[#28B8AA] shrink-0" />
                            <span className="truncate">{client.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#30404E]/60 text-xs">
                          <span className="font-bold text-sm text-[#28B8AA]">
                            ${Number(deal.expected_value).toLocaleString()} USD
                          </span>
                          <span className="text-[10px] text-[#A5B2C1] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {deal.expected_close_date}
                          </span>
                        </div>

                        {/* Pie de Tarjeta: Responsable y Selector Accesible */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#30404E]/40 text-[10px]">
                          <div className="flex items-center gap-1.5 text-[#A5B2C1]">
                            <div className="w-5 h-5 rounded-full bg-[#151F2A] border border-[#30404E] flex items-center justify-center font-bold text-[9px] text-[#28B8AA]">
                              {assignedUser?.full_name ? assignedUser.full_name[0] : 'U'}
                            </div>
                            <span className="truncate max-w-[90px]">{assignedUser?.full_name?.split(' ')[0]}</span>
                          </div>

                          {/* Control accesible para mover de etapa sin drag & drop */}
                          <select
                            value={deal.stage_id}
                            disabled={currentUser.role === 'consulta'}
                            onChange={(e) => handleManualStageChange(deal.id, e.target.value)}
                            className="bg-[#151F2A] border border-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                            title="Mover a etapa"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                &rarr; {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Crear Nueva Oportunidad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Nueva Oportunidad Comercial</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Título de la Oportunidad *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Modernización de Infraestructura Cloud"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Cliente Vinculado *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="crm-input"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.identification_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Valor Estimado ($ USD) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(Number(e.target.value))}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Etapa Inicial</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="crm-input"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.probability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Fecha Estimada de Cierre *</label>
                <input
                  type="date"
                  required
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Notas Comerciales</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre alcance, competidores o decisores..."
                  className="crm-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs"
                >
                  {loading ? 'Guardando...' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
