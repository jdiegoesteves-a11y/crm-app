'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Client,
  Profile,
  SessionUser,
  ClientType,
} from '@/types/database';
import {
  Building2,
  User,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';
import { createClientAction } from '@/app/actions/clients';

interface ClientsClientProps {
  initialClients: Client[];
  users: Profile[];
  currentUser: SessionUser;
}

export function ClientsClient({ initialClients, users, currentUser }: ClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nuevo Cliente
  const [name, setName] = useState('');
  const [type, setType] = useState<ClientType>('empresa');
  const [idType, setIdType] = useState('RUC');
  const [idNumber, setIdNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Quito');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [notes, setNotes] = useState('');

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.identification_number.toLowerCase().includes(term) ||
      (c.industry && c.industry.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      c.email.toLowerCase().includes(term);

    const matchesType = typeFilter === 'todos' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('identification_type', idType);
    formData.append('identification_number', idNumber);
    formData.append('industry', industry);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('city', city);
    formData.append('address', address);
    formData.append('website', website);
    formData.append('assigned_to', assignedTo);
    formData.append('notes', notes);

    const res = await createClientAction(null, formData);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Cliente registrado exitosamente.' });
      setIsNewClientOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al crear cliente.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Directorio de Clientes y Empresas</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {clients.length} Registrados
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Gestión centralizada de cuentas empresariales y personas naturales con vista 360°.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <button
            onClick={() => setIsNewClientOpen(true)}
            className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
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

      {/* Filtros */}
      <div className="crm-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razón social, RUC, industria o ciudad..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#A5B2C1]">Tipo:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
          >
            <option value="todos">Empresas y Personas</option>
            <option value="empresa">Solo Empresas</option>
            <option value="persona">Solo Personas</option>
          </select>
        </div>
      </div>

      {/* Directorio de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.length === 0 ? (
          <div className="col-span-full crm-card p-8 text-center text-[#A5B2C1] text-xs">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          filteredClients.map((client) => {
            const assignedUser = users.find((u) => u.id === client.assigned_to);

            return (
              <div
                key={client.id}
                className="crm-card p-5 flex flex-col justify-between hover:border-[#28B8AA]/60 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#202C39] border border-[#30404E] flex items-center justify-center text-[#28B8AA] group-hover:scale-105 transition-transform shrink-0">
                        {client.type === 'empresa' ? (
                          <Building className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#F4F7FA] truncate group-hover:text-[#28B8AA] transition-colors">
                          {client.name}
                        </h3>
                        <span className="text-[10px] text-[#A5B2C1] font-mono">
                          {client.identification_type}: {client.identification_number}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#202C39] text-[#28B8AA] shrink-0 border border-[#30404E]">
                      {client.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#A5B2C1] pt-2 border-t border-[#30404E]/60">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-[#28B8AA]" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-[#A5B2C1]" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#A5B2C1]" />
                        <span>{client.city} {client.address ? `• ${client.address}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#30404E] flex items-center justify-between text-xs">
                  <div className="text-[10px] text-[#A5B2C1]">
                    Resp: <strong className="text-[#F4F7FA]">{assignedUser?.full_name?.split(' ')[0] || 'Asignado'}</strong>
                  </div>

                  <Link
                    href={`/clientes/${client.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#28B8AA] hover:text-[#28B8AA]/80 transition-colors"
                  >
                    <span>Ver Ficha 360°</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Crear Nuevo Cliente */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Registrar Nuevo Cliente</h3>
              </div>
              <button
                onClick={() => setIsNewClientOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Tipo de Cliente</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ClientType)}
                    className="crm-input"
                  >
                    <option value="empresa">Empresa / Razón Social</option>
                    <option value="persona">Persona Natural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Giro / Industria</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Ej. Tecnología, Retail, Finanzas"
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Corporación Favorita Retail S.A."
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Tipo Identificación</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="crm-input"
                  >
                    <option value="RUC">RUC</option>
                    <option value="Cedula">Cédula</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Número de RUC / ID *</label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="1792345678001"
                    className="crm-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@empresa.com"
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+593 2..."
                    className="crm-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Quito, Guayaquil, Cuenca..."
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Sitio Web</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://empresa.com"
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Principal y Secundaria"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Ejecutivo Asignado</label>
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
                <label className="block text-[#A5B2C1] font-medium mb-1">Notas Comerciales Iniciales</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Acuerdos, contratos previos o comentarios..."
                  className="crm-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="crm-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary text-xs"
                >
                  {loading ? 'Guardando en BD...' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
