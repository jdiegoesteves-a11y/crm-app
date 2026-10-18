'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Client,
  Contact,
  Opportunity,
  Quote,
  Activity,
  Profile,
  PipelineStage,
  SessionUser,
} from '@/types/database';
import {
  Building2,
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Plus,
  Users,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Trash2,
  Edit,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { updateClientAction, deleteClientAction, addClientNoteAction } from '@/app/actions/clients';
import { createContactAction, deleteContactAction } from '@/app/actions/contacts';
import { createOpportunityAction } from '@/app/actions/deals';

interface ClientDetailClientProps {
  client: Client;
  contacts: Contact[];
  opportunities: Opportunity[];
  quotes: Quote[];
  activities: Activity[];
  users: Profile[];
  stages: PipelineStage[];
  currentUser: SessionUser;
}

export function ClientDetailClient({
  client,
  contacts: initialContacts,
  opportunities: initialOpportunities,
  quotes,
  activities,
  users,
  stages,
  currentUser,
}: ClientDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'contactos' | 'oportunidades' | 'cotizaciones' | 'actividades' | 'notas'>('contactos');

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);

  // Formulario Nuevo Contacto
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [contactJob, setContactJob] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactChannel, setContactChannel] = useState('email');

  // Formulario Nueva Oportunidad
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number>(10000);
  const [dealStage, setDealStage] = useState(stages[0]?.id || '');
  const [dealCloseDate, setDealCloseDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const assignedUser = users.find((u) => u.id === client.assigned_to);

  // Métricas agregadas del cliente
  const totalWonValue = opportunities
    .filter((o) => {
      const stage = stages.find((s) => s.id === o.stage_id);
      return stage?.is_won;
    })
    .reduce((sum, o) => sum + Number(o.expected_value), 0);

  const activePipelineValue = opportunities
    .filter((o) => {
      const stage = stages.find((s) => s.id === o.stage_id);
      return !stage?.is_won && !stage?.is_lost;
    })
    .reduce((sum, o) => sum + Number(o.expected_value), 0);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setLoading(true);

    const res = await addClientNoteAction(client.id, newNote);
    if (res?.success) {
      setNewNote('');
      setFeedback({ type: 'success', text: 'Nota agregada a la bitácora.' });
      router.refresh();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al guardar la nota.' });
    }
    setLoading(false);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('client_id', client.id);
    formData.append('first_name', contactFirst);
    formData.append('last_name', contactLast);
    formData.append('job_title', contactJob);
    formData.append('email', contactEmail);
    formData.append('phone', contactPhone);
    formData.append('preferred_channel', contactChannel);

    const res = await createContactAction(null, formData);
    if (res?.success) {
      setIsAddContactOpen(false);
      setContactFirst('');
      setContactLast('');
      setContactJob('');
      setContactEmail('');
      setContactPhone('');
      setFeedback({ type: 'success', text: res.message || 'Contacto agregado exitosamente.' });
      router.refresh();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al agregar contacto.' });
    }
    setLoading(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Desea eliminar este contacto?')) return;
    const res = await deleteContactAction(contactId);
    if (res?.success) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setFeedback({ type: 'success', text: 'Contacto eliminado.' });
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al eliminar.' });
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', dealTitle);
    formData.append('client_id', client.id);
    formData.append('stage_id', dealStage);
    formData.append('expected_value', dealValue.toString());
    formData.append('expected_close_date', dealCloseDate);
    formData.append('assigned_to', client.assigned_to);

    const res = await createOpportunityAction(null, formData);
    if (res?.success) {
      setIsAddDealOpen(false);
      setDealTitle('');
      setFeedback({ type: 'success', text: res.message || 'Oportunidad creada en el embudo.' });
      router.refresh();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al crear oportunidad.' });
    }
    setLoading(false);
  };

  const handleDeleteClient = async () => {
    if (!confirm(`¿Confirma que desea eliminar definitivamente al cliente ${client.name}?`)) return;
    const res = await deleteClientAction(client.id);
    if (res?.success) {
      router.push('/clientes');
    } else {
      setFeedback({ type: 'error', text: res?.error || 'No se pudo eliminar el cliente.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón de Retorno y Acciones */}
      <div className="flex items-center justify-between">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs text-[#A5B2C1] hover:text-[#28B8AA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Directorio de Clientes</span>
        </Link>

        {['admin', 'gerente'].includes(currentUser.role) && (
          <button
            onClick={handleDeleteClient}
            className="px-3 py-1.5 rounded-lg border border-[#F17474]/40 text-[#F17474] hover:bg-[#F17474]/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Cliente</span>
          </button>
        )}
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

      {/* Tarjeta Hero 360° del Cliente */}
      <div className="crm-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#30404E]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#202C39] border border-[#30404E] flex items-center justify-center text-[#28B8AA] shadow-lg shrink-0">
              {client.type === 'empresa' ? (
                <Building2 className="w-7 h-7" />
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#F4F7FA]">{client.name}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
                  {client.type}
                </span>
              </div>
              <div className="text-xs text-[#A5B2C1] mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[#F4F7FA]">{client.identification_type}: {client.identification_number}</span>
                <span>•</span>
                <span>Industria: <strong>{client.industry || 'General'}</strong></span>
                <span>•</span>
                <span>Responsable: <strong className="text-[#28B8AA]">{assignedUser?.full_name || 'Sin asignar'}</strong></span>
              </div>
            </div>
          </div>

          {/* Resumen Comercial Rápido */}
          <div className="flex items-center gap-4 bg-[#202C39] p-3.5 rounded-xl border border-[#30404E] text-xs shrink-0">
            <div>
              <span className="text-[10px] text-[#A5B2C1] block">Tratos Ganados</span>
              <span className="font-bold text-[#34C48A] text-sm">${totalWonValue.toLocaleString()} USD</span>
            </div>
            <div className="h-7 w-px bg-[#30404E]" />
            <div>
              <span className="text-[10px] text-[#A5B2C1] block">En Negociación</span>
              <span className="font-bold text-[#28B8AA] text-sm">${activePipelineValue.toLocaleString()} USD</span>
            </div>
          </div>
        </div>

        {/* Metadatos Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs text-[#A5B2C1]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#28B8AA] shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#A5B2C1] shrink-0" />
            <span>{client.phone || 'Sin teléfono'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#A5B2C1] shrink-0" />
            <span className="truncate">{client.city} • {client.address || 'Sin dirección'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#A5B2C1] shrink-0" />
            {client.website ? (
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-[#28B8AA] hover:underline truncate">
                {client.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span>Sin sitio web</span>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de la Ficha 360° */}
      <div className="border-b border-[#30404E] flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('contactos')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'contactos'
              ? 'border-[#28B8AA] text-[#28B8AA]'
              : 'border-transparent text-[#A5B2C1] hover:text-[#F4F7FA]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contactos ({contacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('oportunidades')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'oportunidades'
              ? 'border-[#28B8AA] text-[#28B8AA]'
              : 'border-transparent text-[#A5B2C1] hover:text-[#F4F7FA]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Oportunidades ({opportunities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cotizaciones')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'cotizaciones'
              ? 'border-[#28B8AA] text-[#28B8AA]'
              : 'border-transparent text-[#A5B2C1] hover:text-[#F4F7FA]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Cotizaciones ({quotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('actividades')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'actividades'
              ? 'border-[#28B8AA] text-[#28B8AA]'
              : 'border-transparent text-[#A5B2C1] hover:text-[#F4F7FA]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Actividades ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notas')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'notas'
              ? 'border-[#28B8AA] text-[#28B8AA]'
              : 'border-transparent text-[#A5B2C1] hover:text-[#F4F7FA]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notas y Bitácora</span>
        </button>
      </div>

      {/* Contenido de Pestañas */}
      <div>
        {/* Pestaña: Contactos */}
        {activeTab === 'contactos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F4F7FA]">Personas de Contacto Vinculadas</h3>
              {currentUser.role !== 'consulta' && (
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="crm-button-primary text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Contacto</span>
                </button>
              )}
            </div>

            <div className="crm-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#202C39] text-[#A5B2C1] text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Nombre Completo</th>
                      <th className="py-2.5 px-4">Cargo</th>
                      <th className="py-2.5 px-4">Correo</th>
                      <th className="py-2.5 px-4">Teléfono</th>
                      <th className="py-2.5 px-4">Canal Preferido</th>
                      <th className="py-2.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30404E]/50">
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#A5B2C1]">
                          No hay contactos registrados aún para este cliente.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c) => (
                        <tr key={c.id} className="hover:bg-[#202C39]/40">
                          <td className="py-3 px-4 font-semibold text-[#F4F7FA]">
                            {c.first_name} {c.last_name}
                            {c.is_primary && (
                              <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-[#28B8AA]/20 text-[#28B8AA]">
                                Principal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#A5B2C1]">{c.job_title || 'N/A'}</td>
                          <td className="py-3 px-4 text-[#28B8AA]">{c.email}</td>
                          <td className="py-3 px-4 text-[#A5B2C1]">{c.phone || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#202C39] text-[#F4F7FA] border border-[#30404E]">
                              {c.preferred_channel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {currentUser.role !== 'consulta' && (
                              <button
                                onClick={() => handleDeleteContact(c.id)}
                                className="text-[#A5B2C1] hover:text-[#F17474] p-1"
                                title="Eliminar contacto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Oportunidades */}
        {activeTab === 'oportunidades' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F4F7FA]">Oportunidades Comerciales</h3>
              {currentUser.role !== 'consulta' && (
                <button
                  onClick={() => setIsAddDealOpen(true)}
                  className="crm-button-primary text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Oportunidad</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.length === 0 ? (
                <div className="col-span-full crm-card p-6 text-center text-[#A5B2C1] text-xs">
                  No hay oportunidades comerciales abiertas para este cliente.
                </div>
              ) : (
                opportunities.map((deal) => {
                  const stage = stages.find((s) => s.id === deal.stage_id);

                  return (
                    <div key={deal.id} className="crm-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#F4F7FA] truncate">{deal.title}</span>
                        <span className="text-sm font-bold text-[#28B8AA]">
                          ${Number(deal.expected_value).toLocaleString()} USD
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#A5B2C1]">
                        <span>Etapa: <strong className="text-[#F4F7FA]">{stage?.name}</strong> ({deal.probability}%)</span>
                        <span>Cierre: {deal.expected_close_date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Pestaña: Cotizaciones */}
        {activeTab === 'cotizaciones' && (
          <div className="crm-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#F4F7FA]">Historial de Cotizaciones Emitidas</h3>
                <p className="text-[11px] text-[#A5B2C1]">Cotizaciones y propuestas económicas registradas para este cliente.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/cotizaciones/nueva?clientId=${client.id}`}
                  className="crm-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Cotización</span>
                </Link>
                <Link href="/cotizaciones" className="text-xs text-[#28B8AA] hover:underline font-semibold ml-2">
                  Ver todas &rarr;
                </Link>
              </div>
            </div>

            {quotes.length === 0 ? (
              <p className="text-xs text-[#A5B2C1] py-8 text-center">
                No se han emitido cotizaciones para este cliente.{' '}
                <Link
                  href={`/cotizaciones/nueva?clientId=${client.id}`}
                  className="text-[#28B8AA] hover:underline font-semibold"
                >
                  Crear la primera cotización
                </Link>
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg bg-[#202C39] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-[#30404E] hover:border-[#28B8AA]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cotizaciones/${q.id}`}
                          className="font-bold font-mono text-[#28B8AA] hover:underline"
                        >
                          {q.quote_number}
                        </Link>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#34C48A]/15 text-[#34C48A]">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A5B2C1] mt-1">
                        Emisión: {q.issue_date} • Vence: {q.valid_until}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-bold font-mono text-[#F4F7FA]">
                        ${Number(q.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/cotizaciones/${q.id}`}
                          className="px-2 py-1 rounded bg-[#151F2A] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] text-[11px] font-semibold transition-colors"
                        >
                          Ver
                        </Link>
                        <a
                          href={`/api/quotes/${q.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-[#28B8AA]/15 hover:bg-[#28B8AA]/25 text-[#28B8AA] text-[11px] font-semibold transition-colors"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Actividades */}
        {activeTab === 'actividades' && (
          <div className="crm-card p-6">
            <h3 className="text-sm font-bold text-[#F4F7FA] mb-4">Actividades y Tareas Asociadas</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-[#A5B2C1] py-4 text-center">No hay actividades programadas con este cliente.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {activities.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#F4F7FA]">{a.title}</div>
                      <div className="text-[11px] text-[#A5B2C1] mt-0.5">{a.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#28B8AA]">{a.type}</span>
                      <div className="text-[10px] text-[#A5B2C1]">{new Date(a.due_date).toLocaleDateString('es-EC')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Notas y Bitácora */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <form onSubmit={handleAddNote} className="crm-card p-4 space-y-3">
              <label className="block text-xs font-bold text-[#F4F7FA]">Agregar Nueva Nota a la Ficha</label>
              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escriba un seguimiento, resumen de llamada o acuerdo con el cliente..."
                className="crm-input text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs py-1.5 px-3"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Guardando...' : 'Guardar Nota'}</span>
                </button>
              </div>
            </form>

            <div className="crm-card p-5">
              <h4 className="text-xs font-bold text-[#A5B2C1] uppercase mb-3">Historial de Notas Registradas</h4>
              {client.notes ? (
                <div className="space-y-2 text-xs text-[#F4F7FA] whitespace-pre-wrap font-sans bg-[#202C39]/60 p-4 rounded-xl border border-[#30404E]">
                  {client.notes}
                </div>
              ) : (
                <p className="text-xs text-[#A5B2C1]">No existen notas registradas para este cliente.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Agregar Contacto */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <h3 className="text-base font-bold text-[#F4F7FA]">Agregar Contacto a {client.name}</h3>
              <button onClick={() => setIsAddContactOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={contactFirst}
                    onChange={(e) => setContactFirst(e.target.value)}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={contactLast}
                    onChange={(e) => setContactLast(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Cargo / Puesto</label>
                <input
                  type="text"
                  value={contactJob}
                  onChange={(e) => setContactJob(e.target.value)}
                  placeholder="Ej. Gerente de Operaciones"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Correo *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Canal Preferido</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  className="crm-input"
                >
                  <option value="email">Correo Electrónico</option>
                  <option value="llamada">Llamada Telefónica</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30404E]">
                <button type="button" onClick={() => setIsAddContactOpen(false)} className="crm-button-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="crm-button-primary text-xs">
                  Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Oportunidad */}
      {isAddDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <h3 className="text-base font-bold text-[#F4F7FA]">Nueva Oportunidad Comercial</h3>
              <button onClick={() => setIsAddDealOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Título de la Oportunidad *</label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="Ej. Renovación Licencias Anuales 2026"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Valor Estimado ($ USD) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Etapa del Embudo</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
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
                  value={dealCloseDate}
                  onChange={(e) => setDealCloseDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30404E]">
                <button type="button" onClick={() => setIsAddDealOpen(false)} className="crm-button-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="crm-button-primary text-xs">
                  Crear Oportunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
