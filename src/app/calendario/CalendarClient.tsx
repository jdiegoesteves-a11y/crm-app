'use client';

import React, { useState } from 'react';
import {
  Activity,
  Client,
  Opportunity,
  Profile,
  SessionUser,
  ActivityType,
} from '@/types/database';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Building,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  PhoneCall,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { createActivityAction, updateActivityStatusAction, deleteActivityAction } from '@/app/actions/activities';

interface CalendarClientProps {
  initialActivities: Activity[];
  opportunities: Opportunity[];
  clients: Client[];
  users: Profile[];
  currentUser: SessionUser;
}

export function CalendarClient({
  initialActivities,
  opportunities,
  clients,
  users,
  currentUser,
}: CalendarClientProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario nuevo evento
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('reunion');
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [clientId, setClientId] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);

  // Navegación de fechas
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'mes') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'semana') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'mes') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'semana') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Cálculo de cuadrícula mensual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const typeStyles: Record<ActivityType, { bg: string; text: string }> = {
    llamada: { bg: 'bg-[#F0B454]/20 border-[#F0B454]/50', text: 'text-[#F0B454]' },
    reunion: { bg: 'bg-[#28B8AA]/20 border-[#28B8AA]/50', text: 'text-[#28B8AA]' },
    tarea: { bg: 'bg-[#818cf8]/20 border-[#818cf8]/50', text: 'text-[#818cf8]' },
    visita: { bg: 'bg-[#34C48A]/20 border-[#34C48A]/50', text: 'text-[#34C48A]' },
    email: { bg: 'bg-[#38bdf8]/20 border-[#38bdf8]/50', text: 'text-[#38bdf8]' },
    nota: { bg: 'bg-[#A5B2C1]/20 border-[#A5B2C1]/50', text: 'text-[#A5B2C1]' },
  };

  // Generador de archivo .ICS estándar para integración con Google Calendar / Outlook
  const handleExportIcs = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Executive Dark CRM 2.0//ES\nCALSCALE:GREGORIAN\n";
    activities.forEach((act) => {
      const dt = new Date(act.due_date);
      const dtStr = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      icsContent += `BEGIN:VEVENT\nSUMMARY:${act.title}\nDESCRIPTION:${act.description || ''}\nDTSTART:${dtStr}\nDTEND:${dtStr}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agenda_crm_executive_${monthNames[month]}_${year}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedback({
      type: 'success',
      text: 'Archivo .ICS generado. Puede importarlo directamente en Google Calendar o Apple Calendar sin costo.',
    });
  };

  const handleOpenNewEvent = (dayNumber?: number) => {
    const selectedDate = dayNumber
      ? new Date(year, month, dayNumber).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setPrefilledDate(selectedDate);
    setIsNewEventModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullDueDate = `${prefilledDate}T${eventTime}:00`;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('description', description);
    formData.append('due_date', new Date(fullDueDate).toISOString());
    formData.append('priority', 'alta');
    formData.append('status', 'pendiente');
    if (clientId) formData.append('client_id', clientId);
    formData.append('assigned_to', assignedTo);

    const res = await createActivityAction(null, formData);
    if (res?.success) {
      setIsNewEventModalOpen(false);
      setTitle('');
      setDescription('');
      setFeedback({ type: 'success', text: 'Evento agendado en el calendario.' });
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al agendar evento.' });
    }
    setLoading(false);
  };

  const handleToggleComplete = async (act: Activity) => {
    const nextStatus = act.status === 'completada' ? 'pendiente' : 'completada';
    setActivities((prev) =>
      prev.map((a) => (a.id === act.id ? { ...a, status: nextStatus } : a))
    );
    if (selectedActivity && selectedActivity.id === act.id) {
      setSelectedActivity({ ...selectedActivity, status: nextStatus });
    }
    await updateActivityStatusAction(act.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Barra de Herramientas del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Calendario Comercial</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {activities.length} Eventos Activos
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Programación de citas, visitas y seguimientos comerciales con sincronización de agenda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportIcs}
            className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            title="Exportar archivo compatible con Google Calendar / Outlook"
          >
            <Download className="w-3.5 h-3.5 text-[#28B8AA]" />
            <span>Sincronizar (.ICS)</span>
          </button>

          {currentUser.role !== 'consulta' && (
            <button
              onClick={() => handleOpenNewEvent()}
              className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta */}
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

      {/* Barra de Control de Navegación del Calendario */}
      <div className="crm-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h2 className="text-base font-bold text-[#F4F7FA] min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] text-xs font-semibold text-[#28B8AA] transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* Selector de Modo de Vista */}
        <div className="flex items-center gap-1 bg-[#202C39] p-1 rounded-xl border border-[#30404E] text-xs">
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'mes'
                ? 'bg-[#28B8AA] text-[#0B1118]'
                : 'text-[#A5B2C1] hover:text-[#F4F7FA]'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('semana')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'semana'
                ? 'bg-[#28B8AA] text-[#0B1118]'
                : 'text-[#A5B2C1] hover:text-[#F4F7FA]'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('dia')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'dia'
                ? 'bg-[#28B8AA] text-[#0B1118]'
                : 'text-[#A5B2C1] hover:text-[#F4F7FA]'
            }`}
          >
            Día
          </button>
        </div>
      </div>

      {/* VISTA 1: MENSUAL */}
      {viewMode === 'mes' && (
        <div className="crm-card p-4 overflow-hidden shadow-2xl">
          {/* Encabezados de Días de la Semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#A5B2C1] pb-3 border-b border-[#30404E]">
            <div>Dom</div>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 min-h-[500px]">
            {/* Celdas vacías previas */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] rounded-lg bg-[#202C39]/15 border border-transparent" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayActivities = activities.filter((act) => act.due_date.startsWith(dateStr));

              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  onClick={() => handleOpenNewEvent(day)}
                  className={`min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#28B8AA]/10 border-[#28B8AA] shadow-sm'
                      : 'bg-[#202C39]/50 border-[#30404E]/60 hover:border-[#28B8AA]/40 hover:bg-[#202C39]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-[#28B8AA]' : 'text-[#F4F7FA]'
                      }`}
                    >
                      {day}
                    </span>
                    {dayActivities.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#28B8AA]" />
                    )}
                  </div>

                  {/* Eventos del Día */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayActivities.map((act) => {
                      const style = typeStyles[act.type] || { bg: 'bg-[#202C39]', text: 'text-[#A5B2C1]' };

                      return (
                        <div
                          key={act.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(act);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate transition-all hover:scale-[1.02] ${style.bg} ${style.text}`}
                          title={act.title}
                        >
                          {new Date(act.due_date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}{' '}
                          {act.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: SEMANAL */}
      {viewMode === 'semana' && (
        <div className="crm-card p-4 overflow-x-auto shadow-2xl">
          <div className="grid grid-cols-7 gap-3 min-w-[800px]">
            {Array.from({ length: 7 }).map((_, idx) => {
              const d = new Date(currentDate);
              const dayOfWeek = d.getDay();
              const distance = idx - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
              d.setDate(d.getDate() + distance);

              const dateStr = d.toISOString().split('T')[0];
              const dayActivities = activities.filter((act) => act.due_date.startsWith(dateStr));
              const isToday = d.toDateString() === new Date().toDateString();

              const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[400px] ${
                    isToday ? 'bg-[#28B8AA]/10 border-[#28B8AA]' : 'bg-[#202C39]/40 border-[#30404E]'
                  }`}
                >
                  <div className="pb-2 border-b border-[#30404E]">
                    <div className="text-[11px] font-bold text-[#A5B2C1]">{dayNames[idx]}</div>
                    <div className="text-sm font-bold text-[#F4F7FA] mt-0.5">{d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</div>
                  </div>

                  <div className="space-y-2 mt-3 flex-1 overflow-y-auto">
                    {dayActivities.length === 0 ? (
                      <span className="text-[10px] text-[#64748B] block text-center pt-8">Sin eventos</span>
                    ) : (
                      dayActivities.map((act) => (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className="p-2.5 rounded-lg bg-[#151F2A] border border-[#30404E] hover:border-[#28B8AA] transition-all cursor-pointer text-xs space-y-1"
                        >
                          <div className="font-bold text-[#F4F7FA] line-clamp-1">{act.title}</div>
                          <div className="text-[10px] text-[#28B8AA] font-mono">
                            {new Date(act.due_date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: DIARIA */}
      {viewMode === 'dia' && (
        <div className="crm-card p-6 shadow-2xl space-y-4">
          <div className="pb-3 border-b border-[#30404E] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F4F7FA]">
              Agenda para {currentDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-[#28B8AA] font-bold">Horario Comercial (08:00 - 19:00)</span>
          </div>

          <div className="space-y-3">
            {activities
              .filter((act) => act.due_date.startsWith(currentDate.toISOString().split('T')[0]))
              .length === 0 ? (
              <div className="text-center py-12 text-[#A5B2C1] text-xs">
                No hay actividades ni reuniones programadas para este día.
              </div>
            ) : (
              activities
                .filter((act) => act.due_date.startsWith(currentDate.toISOString().split('T')[0]))
                .map((act) => (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActivity(act)}
                    className="p-4 rounded-xl bg-[#202C39] border border-[#30404E] hover:border-[#28B8AA] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#F4F7FA]">{act.title}</div>
                      <div className="text-xs text-[#A5B2C1] mt-1">{act.description || 'Sin notas'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#28B8AA]">
                        {new Date(act.due_date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#151F2A] text-[#A5B2C1] mt-1 inline-block border border-[#30404E]">
                        {act.type}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Detalle de Actividad Seleccionada */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <span className="text-xs uppercase font-bold text-[#28B8AA] tracking-wider">
                Detalle del Evento
              </span>
              <button onClick={() => setSelectedActivity(null)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="text-base font-bold text-[#F4F7FA]">{selectedActivity.title}</h3>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#202C39] text-[#28B8AA] border border-[#30404E] uppercase">
                  {selectedActivity.type}
                </span>
                <span className="text-[11px] text-[#A5B2C1] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedActivity.due_date).toLocaleString('es-EC')}
                </span>
              </div>

              {selectedActivity.description && (
                <p className="text-xs text-[#A5B2C1] bg-[#202C39]/60 p-3 rounded-lg border border-[#30404E] leading-relaxed">
                  {selectedActivity.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(selectedActivity)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedActivity.status === 'completada'
                      ? 'bg-[#202C39] text-[#A5B2C1]'
                      : 'bg-[#34C48A] text-[#0B1118]'
                  }`}
                >
                  {selectedActivity.status === 'completada' ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="crm-button-secondary text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agendar Nuevo Evento */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Agendar Compromiso Comercial</h3>
              </div>
              <button onClick={() => setIsNewEventModalOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Título o Asunto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Demostración técnica de CRM"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Tipo de Evento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="crm-input"
                  >
                    <option value="reunion">Reunión de Negocios</option>
                    <option value="llamada">Llamada Telefónica</option>
                    <option value="visita">Visita Comercial</option>
                    <option value="tarea">Tarea de Seguimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Fecha Programada</label>
                <input
                  type="date"
                  required
                  value={prefilledDate}
                  onChange={(e) => setPrefilledDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Cliente Vinculado (Opcional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="crm-input"
                >
                  <option value="">Sin cliente asociado</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Notas / Objetivos</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Temas a tratar en la reunión..."
                  className="crm-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs"
                >
                  {loading ? 'Agendando...' : 'Guardar en Calendario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
