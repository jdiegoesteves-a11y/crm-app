'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Client,
  Opportunity,
  Lead,
  Profile,
  SessionUser,
  ActivityType,
  ActivityStatus,
  PriorityLevel,
} from '@/types/database';
import {
  CheckSquare,
  Plus,
  Search,
  PhoneCall,
  Users,
  Calendar,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Building,
  Mail,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  createActivityAction,
  updateActivityStatusAction,
  deleteActivityAction,
} from '@/app/actions/activities';

interface ActivitiesClientProps {
  initialActivities: Activity[];
  clients: Client[];
  opportunities: Opportunity[];
  leads: Lead[];
  users: Profile[];
  currentUser: SessionUser;
}

export function ActivitiesClient({
  initialActivities,
  clients,
  opportunities,
  leads,
  users,
  currentUser,
}: ActivitiesClientProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'pendientes' | 'vencidas' | 'completadas'>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todas');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nueva Actividad
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('tarea');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [priority, setPriority] = useState<PriorityLevel>('media');
  const [clientId, setClientId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);

  const now = new Date().getTime();

  // Métricas calculadas en tiempo real
  const totalCount = activities.length;
  const completedCount = activities.filter((a) => a.status === 'completada').length;
  const pendingCount = activities.filter((a) => a.status === 'pendiente' || a.status === 'en_progreso').length;
  const overdueCount = activities.filter(
    (a) => a.status !== 'completada' && a.status !== 'cancelada' && new Date(a.due_date).getTime() < now
  ).length;

  const typeIcons: Record<ActivityType, React.ElementType> = {
    llamada: PhoneCall,
    reunion: Users,
    tarea: CheckSquare,
    visita: Building,
    email: Mail,
    nota: Clock,
  };

  const typeColors: Record<ActivityType, { bg: string; text: string; label: string }> = {
    llamada: { bg: 'bg-[#F0B454]/15 border-[#F0B454]/40', text: 'text-[#F0B454]', label: 'Llamada' },
    reunion: { bg: 'bg-[#28B8AA]/15 border-[#28B8AA]/40', text: 'text-[#28B8AA]', label: 'Reunión' },
    tarea: { bg: 'bg-[#818cf8]/15 border-[#818cf8]/40', text: 'text-[#818cf8]', label: 'Tarea' },
    visita: { bg: 'bg-[#34C48A]/15 border-[#34C48A]/40', text: 'text-[#34C48A]', label: 'Visita' },
    email: { bg: 'bg-[#38bdf8]/15 border-[#38bdf8]/40', text: 'text-[#38bdf8]', label: 'Email' },
    nota: { bg: 'bg-[#A5B2C1]/15 border-[#A5B2C1]/40', text: 'text-[#A5B2C1]', label: 'Seguimiento' },
  };

  const filteredActivities = activities.filter((act) => {
    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === act.client_id);
    const clientName = client ? client.name.toLowerCase() : '';

    const matchesSearch =
      act.title.toLowerCase().includes(term) ||
      (act.description && act.description.toLowerCase().includes(term)) ||
      clientName.includes(term);

    const isOverdue =
      act.status !== 'completada' && act.status !== 'cancelada' && new Date(act.due_date).getTime() < now;

    let matchesTab = true;
    if (activeTab === 'pendientes') matchesTab = act.status === 'pendiente' || act.status === 'en_progreso';
    else if (activeTab === 'vencidas') matchesTab = isOverdue;
    else if (activeTab === 'completadas') matchesTab = act.status === 'completada';

    const matchesType = typeFilter === 'todas' || act.type === typeFilter;
    const matchesPriority = priorityFilter === 'todas' || act.priority === priorityFilter;

    return matchesSearch && matchesTab && matchesType && matchesPriority;
  });

  const handleToggleStatus = async (act: Activity) => {
    const nextStatus: ActivityStatus = act.status === 'completada' ? 'pendiente' : 'completada';

    // Optimista
    setActivities((prev) =>
      prev.map((a) => (a.id === act.id ? { ...a, status: nextStatus } : a))
    );

    const res = await updateActivityStatusAction(act.id, nextStatus);
    if (res?.success) {
      setFeedback({
        type: 'success',
        text: `Actividad "${act.title}" marcada como ${nextStatus === 'completada' ? 'completada' : 'pendiente'}.`,
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('¿Confirma que desea eliminar esta actividad?')) return;
    const res = await deleteActivityAction(activityId);
    if (res?.success) {
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setFeedback({ type: 'success', text: 'Actividad eliminada.' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('description', description);
    formData.append('due_date', new Date(dueDate).toISOString());
    formData.append('priority', priority);
    formData.append('status', 'pendiente');
    if (clientId) formData.append('client_id', clientId);
    if (opportunityId) formData.append('opportunity_id', opportunityId);
    if (leadId) formData.append('lead_id', leadId);
    formData.append('assigned_to', assignedTo);

    const res = await createActivityAction(null, formData);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Actividad programada exitosamente.' });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al guardar actividad.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Tareas y Actividades Comerciales</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {pendingCount} Pendientes
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Gestione compromisos, llamadas, reuniones y alertas automáticas de seguimiento.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Actividad</span>
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

      {/* Tarjetas Métricas de Productividad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card p-4">
          <span className="text-[11px] text-[#A5B2C1] block">Total Actividades</span>
          <span className="text-xl font-bold text-[#F4F7FA] mt-1 block">{totalCount}</span>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-[#F17474]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A5B2C1]">Actividades Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-[#F17474]" />
          </div>
          <span className="text-xl font-bold text-[#F17474] mt-1 block">{overdueCount}</span>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-[#F0B454]">
          <span className="text-[11px] text-[#A5B2C1] block">Pendientes / En Curso</span>
          <span className="text-xl font-bold text-[#F0B454] mt-1 block">{pendingCount}</span>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-[#34C48A]">
          <span className="text-[11px] text-[#A5B2C1] block">Completadas</span>
          <span className="text-xl font-bold text-[#34C48A] mt-1 block">{completedCount}</span>
        </div>
      </div>

      {/* Pestañas y Filtros */}
      <div className="crm-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Pestañas Rápidas */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'todas'
                  ? 'bg-[#28B8AA] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA]'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'pendientes'
                  ? 'bg-[#F0B454] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA]'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('vencidas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'vencidas'
                  ? 'bg-[#F17474] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA]'
              }`}
            >
              Vencidas ({overdueCount})
            </button>
            <button
              onClick={() => setActiveTab('completadas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'completadas'
                  ? 'bg-[#34C48A] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA]'
              }`}
            >
              Completadas ({completedCount})
            </button>
          </div>

          {/* Filtros Secundarios */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5"
            >
              <option value="todas">Todos los tipos</option>
              <option value="llamada">Llamadas</option>
              <option value="reunion">Reuniones</option>
              <option value="tarea">Tareas</option>
              <option value="visita">Visitas</option>
              <option value="email">Emails</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5"
            >
              <option value="todas">Prioridad (Todas)</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por asunto, cliente o notas de seguimiento..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="crm-card p-8 text-center text-[#A5B2C1] text-xs">
            No se encontraron actividades que coincidan con los criterios.
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isCompleted = act.status === 'completada';
            const isOverdue =
              !isCompleted && act.status !== 'cancelada' && new Date(act.due_date).getTime() < now;
            const Icon = typeIcons[act.type] || CheckSquare;
            const typeMeta = typeColors[act.type] || { bg: 'bg-[#202C39]', text: 'text-[#A5B2C1]', label: 'Actividad' };

            const client = clients.find((c) => c.id === act.client_id);
            const opportunity = opportunities.find((o) => o.id === act.opportunity_id);
            const assignedUser = users.find((u) => u.id === act.assigned_to);

            return (
              <div
                key={act.id}
                className={`crm-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isOverdue ? 'border-[#F17474]/50 bg-[#F17474]/5' : ''
                } ${isCompleted ? 'opacity-65' : ''}`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Botón de Check Rápido */}
                  <button
                    onClick={() => handleToggleStatus(act)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-[#34C48A] border-[#34C48A] text-[#0B1118]'
                        : 'border-[#30404E] hover:border-[#28B8AA] bg-[#202C39]'
                    }`}
                    title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${isCompleted ? 'line-through text-[#A5B2C1]' : 'text-[#F4F7FA]'}`}>
                        {act.title}
                      </span>

                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${typeMeta.bg} ${typeMeta.text}`}>
                        <Icon className="w-3 h-3" />
                        <span>{typeMeta.label}</span>
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F17474]/20 text-[#F17474] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>¡VENCIDA!</span>
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-xs text-[#A5B2C1] mt-1 leading-relaxed line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    {/* Vínculos a Clientes y Oportunidades */}
                    <div className="flex items-center gap-3 text-[11px] text-[#A5B2C1] mt-2 flex-wrap">
                      {client && (
                        <Link
                          href={`/clientes/${client.id}`}
                          className="hover:text-[#28B8AA] flex items-center gap-1 transition-colors"
                        >
                          <Building className="w-3 h-3 text-[#28B8AA]" />
                          <span>{client.name}</span>
                        </Link>
                      )}

                      {opportunity && (
                        <span className="flex items-center gap-1 text-[#F0B454]">
                          <Briefcase className="w-3 h-3" />
                          <span>{opportunity.title}</span>
                        </span>
                      )}

                      <span>• Resp: <strong>{assignedUser?.full_name?.split(' ')[0] || 'Vendedor'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Vencimiento y Acciones */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#30404E]/50">
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${isOverdue ? 'text-[#F17474]' : 'text-[#A5B2C1]'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(act.due_date).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  {currentUser.role !== 'consulta' && (
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="text-[#A5B2C1] hover:text-[#F17474] p-1 transition-colors text-xs flex items-center gap-1"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Crear Nueva Actividad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Programar Nueva Actividad</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Título o Asunto de la Actividad *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Llamada de cierre, Reunión técnica con CTO..."
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Tipo de Actividad</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="crm-input"
                  >
                    <option value="llamada">Llamada Telefónica</option>
                    <option value="reunion">Reunión de Negocios</option>
                    <option value="tarea">Tarea Comercial</option>
                    <option value="visita">Visita a Instalaciones</option>
                    <option value="email">Envío de Correo / Propuesta</option>
                    <option value="nota">Seguimiento Interno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="crm-input"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Fecha y Hora de Vencimiento *</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Vincular a Cliente (Opcional)</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="crm-input"
                  >
                    <option value="">Ninguno</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Vincular a Oportunidad (Opcional)</label>
                  <select
                    value={opportunityId}
                    onChange={(e) => setOpportunityId(e.target.value)}
                    className="crm-input"
                  >
                    <option value="">Ninguna</option>
                    {opportunities.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Responsable Asignado</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="crm-input"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Descripción y Objetivos</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre lo que se debe acordar o preparar..."
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
                  {loading ? 'Guardando...' : 'Programar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
