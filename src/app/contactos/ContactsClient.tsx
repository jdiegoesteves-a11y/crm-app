'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Contact,
  Client,
  SessionUser,
} from '@/types/database';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { createContactAction, deleteContactAction } from '@/app/actions/contacts';

interface ContactsClientProps {
  initialContacts: Contact[];
  clients: Client[];
  currentUser: SessionUser;
}

export function ContactsClient({ initialContacts, clients, currentUser }: ContactsClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nuevo Contacto
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('email');
  const [isPrimary, setIsPrimary] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const client = clients.find((cli) => cli.id === c.client_id);
    const clientName = client ? client.name.toLowerCase() : '';

    return (
      c.first_name.toLowerCase().includes(term) ||
      c.last_name.toLowerCase().includes(term) ||
      (c.job_title && c.job_title.toLowerCase().includes(term)) ||
      c.email.toLowerCase().includes(term) ||
      clientName.includes(term)
    );
  });

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('job_title', jobTitle);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('preferred_channel', preferredChannel);
    formData.append('is_primary', isPrimary ? 'true' : 'false');

    const res = await createContactAction(null, formData);
    if (res?.success) {
      setFeedback({ type: 'success', text: res.message || 'Contacto registrado exitosamente.' });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al guardar contacto.' });
    }
    setLoading(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Confirma que desea eliminar este contacto?')) return;
    const res = await deleteContactAction(contactId);
    if (res?.success) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setFeedback({ type: 'success', text: 'Contacto eliminado.' });
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al eliminar.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Directorio de Contactos</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {contacts.length} Contactos
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Personas clave, directivos y decisores comerciales vinculados a sus empresas clientes.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={clients.length === 0}
            className="crm-button-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
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

      {/* Buscador */}
      <div className="crm-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contacto por nombre, empresa cliente, cargo o email..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>
      </div>

      {/* Tabla de Contactos */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Contacto / Cargo</th>
                <th className="py-3 px-4">Empresa Asociada</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Canal Preferido</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#A5B2C1]">
                    No se encontraron contactos.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const client = clients.find((c) => c.id === contact.client_id);

                  return (
                    <tr key={contact.id} className="hover:bg-[#202C39]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#F4F7FA] flex items-center gap-1.5">
                          {contact.first_name} {contact.last_name}
                          {contact.is_primary && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#28B8AA]/20 text-[#28B8AA]">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#A5B2C1]">{contact.job_title || 'Sin cargo'}</div>
                      </td>

                      <td className="py-3 px-4">
                        {client ? (
                          <Link
                            href={`/clientes/${client.id}`}
                            className="font-medium text-[#F4F7FA] hover:text-[#28B8AA] flex items-center gap-1 transition-colors"
                          >
                            <Building className="w-3.5 h-3.5 text-[#28B8AA]" />
                            <span>{client.name}</span>
                          </Link>
                        ) : (
                          <span className="text-[#64748b]">Empresa no encontrada</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#28B8AA]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-[#A5B2C1]" />
                          <span>{contact.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#A5B2C1] text-[11px]">
                        {contact.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#A5B2C1]" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : (
                          'No registrado'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#202C39] text-[#F4F7FA] border border-[#30404E]">
                          {contact.preferred_channel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {currentUser.role !== 'consulta' && (
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1 text-[#A5B2C1] hover:text-[#F17474] transition-colors"
                            title="Eliminar contacto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal: Crear Nuevo Contacto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Registrar Nuevo Contacto</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Empresa Cliente Asociada *</label>
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
                  <label className="block text-[#A5B2C1] font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Cargo / Posición</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej. Gerente de Compras"
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
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Canal de Contacto Preferido</label>
                <select
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value)}
                  className="crm-input"
                >
                  <option value="email">Correo Electrónico</option>
                  <option value="llamada">Llamada Telefónica</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded bg-[#202C39] border-[#30404E] text-[#28B8AA]"
                />
                <label htmlFor="primaryContact" className="text-[#F4F7FA]">
                  Marcar como contacto principal de la cuenta
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="crm-button-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="crm-button-primary text-xs">
                  {loading ? 'Guardando...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
