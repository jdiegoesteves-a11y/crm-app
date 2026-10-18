'use client';

import React, { useState } from 'react';
import { Profile, SessionUser, UserRole } from '@/types/database';
import {
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import { createUserAction, toggleUserStatusAction, updateUserRoleAction } from '@/app/actions/users';

interface UserManagementClientProps {
  initialProfiles: Profile[];
  currentUser: SessionUser;
}

export function UserManagementClient({ initialProfiles, currentUser }: UserManagementClientProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario nuevo usuario
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Password123!');

  const roleBadges: Record<UserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-[#28B8AA]/15 border-[#28B8AA]/40', text: 'text-[#28B8AA]', label: 'Administrador' },
    gerente: { bg: 'bg-[#34C48A]/15 border-[#34C48A]/40', text: 'text-[#34C48A]', label: 'Gerente Comercial' },
    vendedor: { bg: 'bg-[#F0B454]/15 border-[#F0B454]/40', text: 'text-[#F0B454]', label: 'Vendedor Senior' },
    consulta: { bg: 'bg-[#A5B2C1]/15 border-[#A5B2C1]/40', text: 'text-[#A5B2C1]', label: 'Auditoría / Consulta' },
  };


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedbackMessage(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('role', role);
    formData.append('phone', phone);
    formData.append('password', password);

    const res = await createUserAction(null, formData);

    if (res?.success) {
      setFeedbackMessage({ type: 'success', text: res.message || 'Usuario creado exitosamente.' });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      // Recargar lista
      window.location.reload();
    } else {
      setFeedbackMessage({ type: 'error', text: res?.error || 'Error al crear usuario.' });
    }
    setLoading(false);
  };

  const handleToggleStatus = async (userId: string) => {
    const res = await toggleUserStatusAction(userId);
    if (res?.success) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, is_active: res.isActive ?? !p.is_active } : p))
      );
      setFeedbackMessage({ type: 'success', text: 'Estado del usuario actualizado exitosamente.' });
    } else {
      setFeedbackMessage({ type: 'error', text: res?.error || 'No se pudo modificar el estado.' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await updateUserRoleAction(userId, newRole);
    if (res?.success) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setFeedbackMessage({ type: 'success', text: 'Rol actualizado en servidor y base de datos.' });
    } else {
      setFeedbackMessage({ type: 'error', text: res?.error || 'No se pudo actualizar el rol.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F4F7FA]">Administración de Usuarios y Permisos (RBAC)</h2>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Gestione las cuentas de acceso, roles empresariales y estados de activación.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Alertas de Notificación */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-[#34C48A]/15 border-[#34C48A]/40 text-[#34C48A]'
              : 'bg-[#F17474]/15 border-[#F17474]/40 text-[#F17474]'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Usuario / Nombre</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {profiles.map((p) => {
                const isSelf = p.id === currentUser.id;

                return (
                  <tr key={p.id} className="hover:bg-[#202C39]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#202C39] border border-[#30404E] flex items-center justify-center font-bold text-xs text-[#28B8AA]">
                          {p.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-[#F4F7FA] flex items-center gap-1.5">
                            {p.full_name}
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#28B8AA]/20 text-[#28B8AA]">
                                Mi usuario
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#A5B2C1] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {p.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={p.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        className={`text-xs px-2.5 py-1 rounded-lg border bg-[#151F2A] font-semibold cursor-pointer ${
                          roleBadges[p.role].bg
                        } ${roleBadges[p.role].text}`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="gerente">Gerente</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="consulta">Consulta</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-[#A5B2C1]">
                      {p.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#28B8AA]" />
                          <span>{p.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[#64748b]">No registrado</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.is_active
                            ? 'bg-[#34C48A]/15 text-[#34C48A] border border-[#34C48A]/30'
                            : 'bg-[#F17474]/15 text-[#F17474] border border-[#F17474]/30'
                        }`}
                      >
                        {p.is_active ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#A5B2C1] text-[11px]">
                      {p.last_login_at
                        ? new Date(p.last_login_at).toLocaleString('es-EC', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : 'Nunca'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            p.is_active
                              ? 'border-[#F17474]/40 text-[#F17474] hover:bg-[#F17474]/10'
                              : 'border-[#34C48A]/40 text-[#34C48A] hover:bg-[#34C48A]/10'
                          }`}
                        >
                          {p.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#30404E] mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Alta de Nuevo Usuario</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Roberto Zambrano"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Rol en el Sistema</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="crm-input"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                    <option value="consulta">Consulta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Teléfono</label>
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
                <label className="block text-[#A5B2C1] font-medium mb-1">Contraseña Inicial</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="crm-input pl-9 font-mono"
                  />
                </div>
                <span className="text-[10px] text-[#A5B2C1] mt-1 block">
                  El usuario podrá cambiar su contraseña desde su perfil o mediante recuperación.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30404E]">
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
                  {loading ? 'Guardando en BD...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
