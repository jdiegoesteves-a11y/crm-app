'use client';

import React, { useState } from 'react';
import {
  Lead,
  Profile,
  SessionUser,
  LeadStatus,
  PriorityLevel,
  PipelineStage,
} from '@/types/database';
import {
  UserPlus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  Edit,
  Mail,
  Phone,
  Calendar,
  Building,
  DollarSign,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
  convertLeadAction,
  importLeadsCsvAction,
  CsvLeadRow,
} from '@/app/actions/leads';

interface LeadsClientProps {
  initialLeads: Lead[];
  users: Profile[];
  stages: PipelineStage[];
  currentUser: SessionUser;
}

export function LeadsClient({ initialLeads, users, stages, currentUser }: LeadsClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [sourceFilter, setSourceFilter] = useState<string>('todas');

  // Modales
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nuevo Prospecto
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('web');
  const [interest, setInterest] = useState('');
  const [status, setStatus] = useState<LeadStatus>('nuevo');
  const [priority, setPriority] = useState<PriorityLevel>('media');
  const [estimatedValue, setEstimatedValue] = useState<number>(5000);
  const [assignedTo, setAssignedTo] = useState<string>(currentUser.id);
  const [nextFollowup, setNextFollowup] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Formulario de Conversión
  const [identificationType, setIdentificationType] = useState('RUC');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || '');

  // Estado del Importador CSV
  const [csvText, setCsvText] = useState('');
  const [parsedCsvRows, setParsedCsvRows] = useState<CsvLeadRow[]>([]);

  // Filtrado de prospectos
  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      lead.first_name.toLowerCase().includes(term) ||
      lead.last_name.toLowerCase().includes(term) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(term)) ||
      lead.email.toLowerCase().includes(term) ||
      lead.interest.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'todas' || lead.priority === priorityFilter;
    const matchesSource = sourceFilter === 'todas' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('company_name', companyName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('source', source);
    formData.append('interest', interest);
    formData.append('status', status);
    formData.append('priority', priority);
    formData.append('estimated_value', estimatedValue.toString());
    formData.append('assigned_to', assignedTo);
    formData.append('next_followup_at', nextFollowup);
    formData.append('notes', notes);

    const res = await createLeadAction(null, formData);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Prospecto registrado exitosamente.' });
      setIsNewLeadOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al crear prospecto.' });
    }
    setLoading(false);
  };

  const handleStartConversion = (lead: Lead) => {
    setConvertingLead(lead);
    setIdentificationType(lead.company_name ? 'RUC' : 'Cedula');
    setIdentificationNumber(lead.company_name ? '179' + Math.floor(100000000 + Math.random() * 900000000) + '001' : '17' + Math.floor(10000000 + Math.random() * 90000000));
    setOpportunityTitle(`Oportunidad: ${lead.interest || lead.company_name || lead.first_name}`);
    setSelectedStageId(stages[0]?.id || '');
  };

  const handleConfirmConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    setLoading(true);

    const res = await convertLeadAction(convertingLead.id, {
      identification_type: identificationType,
      identification_number: identificationNumber,
      opportunity_title: opportunityTitle,
      stage_id: selectedStageId,
    });

    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Prospecto convertido exitosamente.' });
      setConvertingLead(null);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al convertir prospecto.' });
    }
    setLoading(false);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('¿Confirma que desea eliminar este prospecto?')) return;
    const res = await deleteLeadAction(leadId);
    if (res?.success) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setFeedback({ type: 'success', text: 'Prospecto eliminado.' });
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al eliminar.' });
    }
  };

  // Procesamiento simple y seguro de CSV
  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const parsed: CsvLeadRow[] = [];

    // Formato esperado: nombre,apellido,empresa,email,telefono,interes,valor
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Si la primera fila es encabezado
      if (i === 0 && (line.toLowerCase().includes('nombre') || line.toLowerCase().includes('email'))) {
        continue;
      }

      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 4) {
        parsed.push({
          first_name: cols[0] || 'Contacto',
          last_name: cols[1] || '',
          company_name: cols[2] || undefined,
          email: cols[3] || '',
          phone: cols[4] || undefined,
          interest: cols[5] || 'Interés general',
          estimated_value: Number(cols[6]) || 5000,
          source: 'import_csv',
          priority: 'media',
        });
      }
    }
    setParsedCsvRows(parsed);
  };

  const handleExecuteImport = async () => {
    if (parsedCsvRows.length === 0) return;
    setLoading(true);
    const res = await importLeadsCsvAction(parsedCsvRows);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Importación completada.' });
      setIsCsvModalOpen(false);
      setParsedCsvRows([]);
      setCsvText('');
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error en la importación.' });
    }
    setLoading(false);
  };

  const loadExampleCsv = () => {
    const example = `nombre,apellido,empresa,email,telefono,interes,valor
Patricio,Almeida,Metalúrgica del Valle,palmeida@metalvalle.ec,+593 99 222 1100,Software ERP y Control de Stock,18500
Carla,Mendoza,Consultores Tributarios Cía,cmendoza@consultributos.com,+593 98 444 3322,Auditoría y CRM Cloud,12000
Esteban,Paredes,Distribuciones Pichincha,eparedes@dispichincha.com,+593 99 777 8899,Licencias Corporativas 2026,24000`;
    setCsvText(example);
  };

  const statusColors: Record<LeadStatus, { bg: string; text: string }> = {
    nuevo: { bg: 'bg-[#28B8AA]/15 border-[#28B8AA]/40', text: 'text-[#28B8AA]' },
    contactado: { bg: 'bg-[#F0B454]/15 border-[#F0B454]/40', text: 'text-[#F0B454]' },
    calificado: { bg: 'bg-[#34C48A]/15 border-[#34C48A]/40', text: 'text-[#34C48A]' },
    descartado: { bg: 'bg-[#F17474]/15 border-[#F17474]/40', text: 'text-[#F17474]' },
    convertido: { bg: 'bg-[#818cf8]/15 border-[#818cf8]/40', text: 'text-[#818cf8]' },
  };

  const priorityColors: Record<PriorityLevel, { bg: string; text: string }> = {
    alta: { bg: 'bg-[#F17474]/15 border-[#F17474]/40', text: 'text-[#F17474]' },
    media: { bg: 'bg-[#F0B454]/15 border-[#F0B454]/40', text: 'text-[#F0B454]' },
    baja: { bg: 'bg-[#A5B2C1]/15 border-[#A5B2C1]/40', text: 'text-[#A5B2C1]' },
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Gestión de Prospectos (Leads)</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {leads.length} Registrados
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Capture, califique, importe vía CSV y convierta prospectos a clientes y oportunidades con 1 clic.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="crm-button-secondary text-xs py-2 px-3.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#28B8AA]" />
              <span>Importar CSV</span>
            </button>
            <button
              onClick={() => setIsNewLeadOpen(true)}
              className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Prospecto</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Notificación */}
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

      {/* Barra de Filtros y Búsqueda */}
      <div className="crm-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, empresa, email o interés comercial..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#A5B2C1]">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="calificado">Calificado</option>
              <option value="descartado">Descartado</option>
              <option value="convertido">Convertido</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#A5B2C1]">Prioridad:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Prospectos */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Prospecto / Empresa</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Interés Comercial</th>
                <th className="py-3 px-4">Valor Estimado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#A5B2C1]">
                    No se encontraron prospectos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const assignedUser = users.find((u) => u.id === lead.assigned_to);

                  return (
                    <tr key={lead.id} className="hover:bg-[#202C39]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#F4F7FA]">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-[11px] text-[#A5B2C1] flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-[#28B8AA]" />
                          <span>{lead.company_name || 'Particular / Independiente'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#A5B2C1]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-[#A5B2C1]" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-[#64748b] mt-0.5">
                            <Phone className="w-3 h-3 text-[#64748b]" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#F4F7FA] font-medium max-w-xs truncate">
                        {lead.interest}
                      </td>

                      <td className="py-3 px-4 font-bold text-[#28B8AA] whitespace-nowrap">
                        ${Number(lead.estimated_value).toLocaleString()} USD
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            statusColors[lead.status]?.bg || 'bg-[#202C39]'
                          } ${statusColors[lead.status]?.text || 'text-[#A5B2C1]'}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            priorityColors[lead.priority]?.bg || 'bg-[#202C39]'
                          } ${priorityColors[lead.priority]?.text || 'text-[#A5B2C1]'}`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#A5B2C1] text-[11px]">
                        {assignedUser?.full_name || 'Sin asignar'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {currentUser.role !== 'consulta' && (
                          <div className="flex items-center justify-end gap-2">
                            {lead.status !== 'convertido' && (
                              <button
                                onClick={() => handleStartConversion(lead)}
                                className="px-2.5 py-1 rounded bg-[#28B8AA]/15 hover:bg-[#28B8AA]/25 text-[#28B8AA] border border-[#28B8AA]/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="Convertir a Cliente y Oportunidad"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Convertir</span>
                              </button>
                            )}

                            {['admin', 'gerente'].includes(currentUser.role) && (
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1 rounded text-[#A5B2C1] hover:text-[#F17474] transition-colors"
                                title="Eliminar prospecto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Prospecto */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Registrar Nuevo Prospecto</h3>
              </div>
              <button
                onClick={() => setIsNewLeadOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Roberto"
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Gómez"
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Empresa / Razón Social</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. TechSolutions Andina S.A."
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+593 99..."
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Interés Comercial *</label>
                <input
                  type="text"
                  required
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="Ej. Implementación CRM, ERP, Licencias o Consultoría"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Valor Estimado ($ USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(Number(e.target.value))}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="crm-input"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="calificado">Calificado</option>
                    <option value="descartado">Descartado</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Fuente de Captación</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="crm-input"
                  >
                    <option value="web">Formulario Web</option>
                    <option value="referido">Referido Comercial</option>
                    <option value="linkedin">LinkedIn / Redes</option>
                    <option value="feria">Feria / Evento</option>
                    <option value="llamada">Llamada Fría</option>
                    <option value="otro">Otro</option>
                  </select>
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
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de requerimientos, alcance o comentarios..."
                  className="crm-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs"
                >
                  {loading ? 'Guardando en BD...' : 'Registrar Prospecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convertir Prospecto en Cliente + Oportunidad */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Conversión a Cliente y Oportunidad</h3>
              </div>
              <button
                onClick={() => setConvertingLead(null)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#A5B2C1] leading-relaxed mb-4">
              Al convertir a <strong>{convertingLead.first_name} {convertingLead.last_name}</strong>, el sistema creará automáticamente un registro de Cliente corporativo, un Contacto vinculado y una Oportunidad en el Embudo Comercial.
            </p>

            <form onSubmit={handleConfirmConversion} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Tipo de Identificación</label>
                  <select
                    value={identificationType}
                    onChange={(e) => setIdentificationType(e.target.value)}
                    className="crm-input"
                  >
                    <option value="RUC">RUC</option>
                    <option value="Cedula">Cédula</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Número de Identificación *</label>
                  <input
                    type="text"
                    required
                    value={identificationNumber}
                    onChange={(e) => setIdentificationNumber(e.target.value)}
                    className="crm-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Título de la Oportunidad en Embudo *</label>
                <input
                  type="text"
                  required
                  value={opportunityTitle}
                  onChange={(e) => setOpportunityTitle(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Etapa Inicial en el Embudo</label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="crm-input"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.probability}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] text-[11px] text-[#A5B2C1]">
                <div>Valor estimado: <strong className="text-[#28B8AA]">${convertingLead.estimated_value.toLocaleString()} USD</strong></div>
                <div>Cliente: <strong className="text-[#F4F7FA]">{convertingLead.company_name || `${convertingLead.first_name} ${convertingLead.last_name}`}</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs"
                >
                  {loading ? 'Convirtiendo en BD...' : 'Confirmar Conversión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importación CSV con Deduplicación */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Importar Prospectos desde CSV</h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#A5B2C1]">
                  Pegue el contenido CSV con columnas: <code>nombre,apellido,empresa,email,telefono,interes,valor</code>
                </p>
                <button
                  type="button"
                  onClick={loadExampleCsv}
                  className="text-[11px] text-[#28B8AA] hover:underline font-semibold"
                >
                  Cargar Ejemplo
                </button>
              </div>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="nombre,apellido,empresa,email,telefono,interes,valor&#10;Juan,Pérez,Corp Alfa,juan@alfa.com,+593991234567,ERP Cloud,15000"
                className="crm-input font-mono text-[11px]"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="crm-button-secondary text-xs py-1.5 px-3"
                >
                  Validar y Previsualizar ({parsedCsvRows.length} detectados)
                </button>
              </div>

              {parsedCsvRows.length > 0 && (
                <div className="border border-[#30404E] rounded-lg max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#202C39] text-[#A5B2C1] sticky top-0">
                      <tr>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Empresa</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30404E]/50">
                      {parsedCsvRows.map((r, i) => (
                        <tr key={i} className="hover:bg-[#202C39]/40">
                          <td className="p-2 text-[#F4F7FA]">{r.first_name} {r.last_name}</td>
                          <td className="p-2 text-[#A5B2C1]">{r.company_name || 'N/A'}</td>
                          <td className="p-2 text-[#28B8AA]">{r.email}</td>
                          <td className="p-2 font-bold">${r.estimated_value} USD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading || parsedCsvRows.length === 0}
                  onClick={handleExecuteImport}
                  className="crm-button-primary text-xs disabled:opacity-50"
                >
                  {loading ? 'Importando...' : `Importar ${parsedCsvRows.length} Prospectos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
