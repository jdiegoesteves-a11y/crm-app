'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Conversation,
  ChatMessage,
  Client,
  Lead,
  Opportunity,
  Profile,
  SessionUser,
  ConversationStatus,
} from '@/types/database';
import {
  Search,
  Filter,
  Send,
  Lock,
  MessageSquare,
  User,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Link as LinkIcon,
  UserCheck,
  RefreshCw,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  sendChatMessageAction,
  assignConversationAction,
  updateConversationStatusAction,
  linkConversationToClientAction,
  deleteConversationAction,
} from '@/app/actions/messages';

interface MessagesClientProps {
  conversations: Conversation[];
  messages: ChatMessage[];
  clients: Client[];
  leads: Lead[];
  opportunities: Opportunity[];
  users: Profile[];
  currentUser: SessionUser;
  isInstagramConnected: boolean;
  connectedUsername?: string;
}

export function MessagesClient({
  conversations: initialConversations,
  messages: initialMessages,
  clients,
  leads,
  opportunities,
  users,
  currentUser,
  isInstagramConnected,
  connectedUsername,
}: MessagesClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedConvId, setSelectedConvId] = useState<string>(
    initialConversations[0]?.id || ''
  );

  // Sincronizar estado cuando el servidor Next.js actualiza props
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Polling automático cada 4 segundos para actualizar mensajes entrantes en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Input del chat
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal para vincular a cliente
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const convMessages = messages.filter((m) => m.conversation_id === selectedConvId);

  // Auto scroll al final de la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length, selectedConvId]);

  // Filtrado de conversaciones
  const filteredConversations = conversations.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (c.contact_name?.toLowerCase().includes(term) ?? false) ||
      (c.contact_username?.toLowerCase().includes(term) ?? false) ||
      c.contact_external_id.includes(term) ||
      c.last_message_text.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Datos asociados a la conversación seleccionada
  const linkedLead = selectedConv?.lead_id
    ? leads.find((l) => l.id === selectedConv.lead_id)
    : undefined;

  const linkedClient = selectedConv?.client_id
    ? clients.find((c) => c.id === selectedConv.client_id)
    : undefined;

  const clientOpportunities = linkedClient
    ? opportunities.filter((o) => o.client_id === linkedClient.id)
    : [];

  const assignedUser = selectedConv?.assigned_to
    ? users.find((u) => u.id === selectedConv.assigned_to)
    : undefined;

  // Comprobación de la ventana de 24 horas de Meta
  const now = new Date();
  const isWindowExpired = Boolean(
    selectedConv?.window_expires_at && new Date(selectedConv.window_expires_at) < now
  );

  let hoursRemaining = 0;
  if (selectedConv?.window_expires_at && !isWindowExpired) {
    const diffMs = new Date(selectedConv.window_expires_at).getTime() - now.getTime();
    hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 3600)));
  }

  // Enviar mensaje o nota
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    setSending(true);
    setFeedback(null);

    try {
      const res = await sendChatMessageAction(selectedConvId, replyText, isInternalNote);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? {
                  ...c,
                  last_message_text: isInternalNote ? c.last_message_text : `Tú: ${replyText.trim()}`,
                  last_message_at: new Date().toISOString(),
                }
              : c
          )
        );
        setReplyText('');
      } else {
        setFeedback({ type: 'error', text: res.error || 'No se pudo enviar el mensaje.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setSending(false);
    }
  };

  // Reasignar asesor
  const handleAssignAgent = async (agentId: string) => {
    if (!selectedConvId) return;
    try {
      const res = await assignConversationAction(selectedConvId, agentId);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, assigned_to: agentId, status: 'en_atencion' } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cambiar estado de atención
  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!selectedConvId) return;
    try {
      const res = await updateConversationStatusAction(selectedConvId, newStatus);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Eliminar conversación (para chats demo o antiguos)
  const handleDeleteConversation = async () => {
    if (!selectedConvId) return;
    if (!confirm('¿Desea eliminar esta conversación y todos sus mensajes?')) return;
    try {
      const res = await deleteConversationAction(selectedConvId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== selectedConvId));
        setMessages((prev) => prev.filter((m) => m.conversation_id !== selectedConvId));
        setSelectedConvId('');
        setFeedback({ type: 'success', text: 'Conversación eliminada con éxito.' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al eliminar conversación' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  // Vincular a cliente
  const handleLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedConvId) return;

    try {
      const res = await linkConversationToClientAction(selectedConvId, selectedClientId);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, client_id: selectedClientId } : c))
        );
        setLinkModalOpen(false);
        setFeedback({ type: 'success', text: 'Conversación vinculada al cliente con éxito.' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Respuestas rápidas predefinidas
  const quickReplies = [
    '¡Hola! Gracias por comunicarte con nosotros. ¿En qué podemos ayudarte hoy?',
    'Con gusto, ¿nos podrías facilitar un correo o número telefónico de contacto?',
    'Te confirmamos que hemos recibido tu requerimiento y un asesor técnico lo está revisando.',
    'Estimado cliente, te compartimos nuestra propuesta comercial en PDF adjunto.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Banner Superior si Instagram no está conectado */}
      {!isInstagramConnected && (
        <div className="p-3 rounded-lg bg-[#F0B454]/10 border border-[#F0B454]/30 text-xs flex items-center justify-between text-[#F0B454] shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              La cuenta de Instagram Direct no está conectada o requiere autorización en Configuración.
            </span>
          </div>
          <Link
            href="/configuracion/integraciones/instagram"
            className="font-bold underline hover:text-[#F4F7FA] ml-2 shrink-0"
          >
            Conectar ahora &rarr;
          </Link>
        </div>
      )}

      {/* Banner de Canal Activo en Producción */}
      {isInstagramConnected && (
        <div className="px-3.5 py-2 rounded-xl bg-[#28B8AA]/10 border border-[#28B8AA]/30 text-xs flex items-center justify-between text-[#28B8AA] shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C48A] animate-pulse shadow-sm shadow-[#34C48A]" />
            <span className="text-[#F4F7FA] font-bold">Instagram Direct Oficial Operativo:</span>
            <span className="font-mono text-[#28B8AA] bg-[#28B8AA]/15 px-2 py-0.5 rounded border border-[#28B8AA]/25">
              @{connectedUsername || 'novaexa.ec'}
            </span>
            <span className="text-[11px] text-[#A5B2C1] hidden sm:inline">
              • Recepción de mensajes en tiempo real activa
            </span>
          </div>
          <Link
            href="/configuracion/integraciones/instagram"
            className="text-[11px] font-semibold text-[#A5B2C1] hover:text-[#F4F7FA] underline ml-2 shrink-0"
          >
            Ajustes del Canal
          </Link>
        </div>
      )}

      {/* Grid de 3 Paneles Omnicanal */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* PANEL IZQUIERDO: LISTA DE CONVERSACIONES (Cols 3/12) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 crm-card flex flex-col min-h-0 overflow-hidden">
          {/* Cabecera del Panel Izquierdo */}
          <div className="p-3.5 border-b border-[#30404E] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#28B8AA]" />
                <h2 className="text-sm font-bold text-[#F4F7FA]">Bandeja Omnicanal</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202C39] text-[#28B8AA] border border-[#30404E]">
                {conversations.length} chats
              </span>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario o texto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="crm-input pl-8 text-xs w-full py-1.5"
              />
            </div>

            {/* Filtros por Estado */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'sin_asignar', label: 'Sin Asignar' },
                { id: 'en_atencion', label: 'En Atención' },
                { id: 'resuelta', label: 'Resueltas' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-[#28B8AA] text-[#0B1118]'
                      : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Scrollable de Conversaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#30404E]/40">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A5B2C1]">
                <MessageSquare className="w-8 h-8 mx-auto text-[#30404E] mb-2" />
                <p>No hay conversaciones que coincidan.</p>
                <p className="text-[10px] mt-1 text-[#A5B2C1]/60">
                  Los mensajes enviados a su Instagram aparecerán aquí de inmediato.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const convTime = new Date(c.last_message_at).toLocaleTimeString('es-EC', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#202C39] border-l-4 border-[#28B8AA]'
                        : 'hover:bg-[#202C39]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar con Icono de Canal Instagram */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-[#151F2A] border border-[#30404E] flex items-center justify-center font-bold text-xs text-[#F4F7FA]">
                            {(c.contact_name || c.contact_username || 'IG')[0].toUpperCase()}
                          </div>
                          {/* Badge de Canal */}
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-tr from-[#F09433] via-[#E6683C] to-[#BC1888] flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                            title="Instagram Direct"
                          >
                            IG
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[#F4F7FA] truncate">
                              {c.contact_name || `@${c.contact_username}` || 'Usuario Instagram'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A5B2C1] truncate mt-0.5">
                            {c.last_message_text}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[#A5B2C1]">{convTime}</span>
                        {c.unread_count > 0 && (
                          <div className="mt-1 w-4 h-4 rounded-full bg-[#28B8AA] text-[#0B1118] text-[9px] font-bold flex items-center justify-center ml-auto">
                            {c.unread_count}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado y Asesor */}
                    <div className="flex items-center justify-between mt-2 pt-1 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold capitalize ${
                          c.status === 'sin_asignar'
                            ? 'bg-[#F0B454]/15 text-[#F0B454]'
                            : c.status === 'en_atencion'
                            ? 'bg-[#28B8AA]/15 text-[#28B8AA]'
                            : 'bg-[#34C48A]/15 text-[#34C48A]'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>

                      {c.assigned_to && (
                        <span className="text-[#A5B2C1] truncate max-w-[100px]">
                          {users.find((u) => u.id === c.assigned_to)?.full_name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL CENTRAL: CONVERSACIÓN Y ENVÍO (Cols 6/12) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-6 crm-card flex flex-col min-h-0 overflow-hidden">
          {selectedConv ? (
            <>
              {/* Encabezado del Chat */}
              <div className="p-3.5 border-b border-[#30404E] flex items-center justify-between bg-[#151F2A]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F09433] via-[#E6683C] to-[#BC1888] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    IG
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-[#F4F7FA] truncate">
                        {selectedConv.contact_name || `@${selectedConv.contact_username}`}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30 font-semibold">
                        Instagram Direct
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A5B2C1] truncate font-mono">
                      ID: {selectedConv.contact_external_id}
                    </p>
                  </div>
                </div>

                {/* Acciones Rápidas de Estado */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedConv.status}
                    onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                    className="crm-input text-[10px] font-bold py-1 px-2 cursor-pointer"
                  >
                    <option value="sin_asignar">Sin Asignar</option>
                    <option value="en_atencion">En Atención</option>
                    <option value="resuelta">Resuelta</option>
                    <option value="pendiente">Pendiente</option>
                  </select>

                  {['admin', 'gerente'].includes(currentUser.role) && (
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="p-1 rounded bg-[#F17474]/15 hover:bg-[#F17474]/25 text-[#F17474] transition-colors"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Banner de Contacto de Demostración */}
              {(selectedConv.contact_external_id === '17841400123456789' ||
                selectedConv.contact_external_id.startsWith('test_ig_') ||
                selectedConv.contact_external_id.startsWith('demo_')) && (
                <div className="py-2 px-3 text-[11px] bg-[#F0B454]/15 text-[#F0B454] border-b border-[#F0B454]/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#F0B454]" />
                    <span className="truncate">
                      <strong>Contacto de Ejemplo:</strong> Este chat usa un ID simulado ({selectedConv.contact_external_id}). Meta solo permite responder a usuarios reales que escriban a <strong>@novaexa.ec</strong>.
                    </span>
                  </div>
                  {['admin', 'gerente'].includes(currentUser.role) && (
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="px-2 py-0.5 rounded bg-[#F17474]/20 hover:bg-[#F17474]/30 text-[#F17474] text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
              )}

              {/* Banner de Ventana de 24 Horas de Meta */}
              {selectedConv.window_expires_at && (
                <div
                  className={`py-1.5 px-3 text-[11px] flex items-center justify-between border-b ${
                    isWindowExpired
                      ? 'bg-[#F17474]/10 text-[#F17474] border-[#F17474]/30'
                      : 'bg-[#28B8AA]/10 text-[#28B8AA] border-[#28B8AA]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isWindowExpired
                        ? 'Ventana de 24h de Meta expirada. Solo puede registrar Notas Internas hasta que el cliente escriba.'
                        : `Ventana de mensajería activa: aprox. ${hoursRemaining} horas restantes para responder.`}
                    </span>
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`p-2.5 text-xs flex items-center gap-2 border-b ${
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

              {/* Área de Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0E1620]">
                {convMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#A5B2C1]">
                    <Sparkles className="w-6 h-6 mx-auto text-[#28B8AA] mb-2" />
                    <p>Inicio de la conversación en Instagram.</p>
                  </div>
                ) : (
                  convMessages.map((msg) => {
                    const isAgent = msg.sender_type === 'agent';
                    const timeStr = new Date(msg.created_at).toLocaleTimeString('es-EC', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Caso 1: Nota Interna Privada
                    if (msg.is_internal_note) {
                      return (
                        <div
                          key={msg.id}
                          className="p-3 rounded-lg bg-[#F0B454]/10 border border-[#F0B454]/30 text-xs text-[#F4F7FA] my-2 max-w-[85%] mx-auto"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-[#F0B454] font-bold mb-1">
                            <Lock className="w-3 h-3" />
                            <span>NOTA INTERNA PRIVADA — {msg.sender_name}</span>
                            <span className="ml-auto text-[9px] text-[#A5B2C1]">{timeStr}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    }

                    // Caso 2: Mensaje Saliente del Asesor
                    if (isAgent) {
                      const isFailed = msg.status === 'fallido';

                      return (
                        <div key={msg.id} className="flex flex-col items-end">
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                              isFailed
                                ? 'bg-[#F17474]/15 border border-[#F17474]/40 text-[#F4F7FA]'
                                : 'bg-[#28B8AA] text-[#0B1118] font-medium'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                isFailed ? 'text-[#F17474]' : 'text-[#0B1118]/70 font-semibold'
                              }`}
                            >
                              <span>{timeStr}</span>
                              {isFailed ? (
                                <span title={msg.error_details || 'Error al enviar'} className="flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" /> Falló
                                </span>
                              ) : (
                                <span>• Enviado</span>
                              )}
                            </div>
                          </div>
                          {isFailed && msg.error_details && (
                            <span className="text-[10px] text-[#F17474] mt-0.5 max-w-[78%] text-right">
                              {msg.error_details}
                            </span>
                          )}
                        </div>
                      );
                    }

                    // Caso 3: Mensaje Entrante del Cliente por Instagram
                    return (
                      <div key={msg.id} className="flex flex-col items-start">
                        <div className="max-w-[78%] rounded-2xl px-4 py-2.5 text-xs bg-[#202C39] text-[#F4F7FA] border border-[#30404E]/60 shadow-sm">
                          <span className="text-[10px] font-bold text-[#28B8AA] block mb-0.5">
                            {msg.sender_name}
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className="text-right mt-1 text-[9px] text-[#A5B2C1]">
                            {timeStr}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Respuestas Rápidas Predefinidas */}
              <div className="px-3 py-1.5 bg-[#151F2A] border-t border-[#30404E] flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <span className="text-[#A5B2C1] font-semibold flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3 text-[#28B8AA]" /> Rápidas:
                </span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(qr)}
                    className="px-2 py-0.5 rounded bg-[#202C39] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors truncate max-w-[200px] shrink-0"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Formulario de Envío de Mensaje */}
              <form onSubmit={handleSend} className="p-3 bg-[#151F2A] border-t border-[#30404E] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {/* Selector: Mensaje vs Nota Interna */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        !isInternalNote
                          ? 'bg-[#28B8AA] text-[#0B1118]'
                          : 'text-[#A5B2C1] hover:text-[#F4F7FA]'
                      }`}
                    >
                      Mensaje a Instagram
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isInternalNote
                          ? 'bg-[#F0B454] text-[#0B1118]'
                          : 'text-[#A5B2C1] hover:text-[#F4F7FA]'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Nota Interna Privada</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-[#A5B2C1]">
                    {isInternalNote ? 'Visible solo para asesores' : 'Se enviará a Instagram Direct'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Escribir una nota interna para el equipo comercial...'
                        : isWindowExpired
                        ? 'Ventana expirada: solo notas internas permitidas'
                        : 'Escribir respuesta al cliente de Instagram...'
                    }
                    disabled={sending || (!isInternalNote && isWindowExpired)}
                    className="crm-input text-xs w-full py-2"
                  />

                  <button
                    type="submit"
                    disabled={sending || !replyText.trim() || (!isInternalNote && isWindowExpired)}
                    className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                      isInternalNote
                        ? 'bg-[#F0B454] text-[#0B1118] hover:bg-[#F0B454]/90'
                        : 'crm-button-primary'
                    }`}
                  >
                    {sending ? (
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#0B1118] rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isInternalNote ? 'Guardar Nota' : 'Enviar'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A5B2C1]">
              <MessageSquare className="w-12 h-12 text-[#30404E] mb-3" />
              <p className="font-semibold text-sm">Selecciona una conversación</p>
              <p className="text-xs mt-1">Elige un chat de la lista izquierda para atender al cliente.</p>
            </div>
          )}
        </div>

        {/* PANEL DERECHO: FICHA 360° DEL CLIENTE / PROSPECTO (Cols 3/12) */}
        <div className="hidden lg:flex col-span-3 crm-card flex-col min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="border-b border-[#30404E] pb-2 flex items-center justify-between">
            <h3 className="font-bold text-xs text-[#F4F7FA] uppercase tracking-wider">
              Ficha del Contacto
            </h3>
            <span className="text-[10px] text-[#28B8AA] font-bold">360° Comercial</span>
          </div>

          {selectedConv ? (
            <div className="space-y-4 text-xs">
              {/* Identidad en Instagram */}
              <div className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] space-y-1.5">
                <span className="text-[10px] text-[#A5B2C1] uppercase font-bold flex items-center gap-1">
                  <User className="w-3 h-3 text-[#28B8AA]" /> Identidad en Instagram
                </span>
                <p className="font-bold text-[#F4F7FA]">
                  {selectedConv.contact_name || `@${selectedConv.contact_username}`}
                </p>
                <div className="text-[10px] text-[#A5B2C1] space-y-0.5">
                  <div>Canal: <strong>Instagram Direct</strong></div>
                  <div>IGSID: <code className="text-[#28B8AA]">{selectedConv.contact_external_id}</code></div>
                </div>
              </div>

              {/* Asesor Asignado y Transferencia */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A5B2C1]">
                  Asesor Comercial Responsable:
                </label>
                <select
                  value={selectedConv.assigned_to || ''}
                  onChange={(e) => handleAssignAgent(e.target.value)}
                  className="crm-input text-xs w-full py-1.5"
                >
                  <option value="">Sin Asignar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vinculación con Prospecto o Cliente */}
              <div className="p-3 rounded-lg bg-[#202C39] border border-[#30404E] space-y-2">
                <span className="text-[10px] text-[#A5B2C1] uppercase font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#28B8AA]" /> Registro Comercial
                </span>

                {linkedClient ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#34C48A] font-bold block">CLIENTE REGISTRADO</span>
                    <Link
                      href={`/clientes/${linkedClient.id}`}
                      className="font-bold text-xs text-[#F4F7FA] hover:text-[#28B8AA] block transition-colors"
                    >
                      {linkedClient.name} &rarr;
                    </Link>
                    <p className="text-[10px] text-[#A5B2C1]">
                      {linkedClient.identification_type}: {linkedClient.identification_number}
                    </p>
                    <p className="text-[10px] text-[#A5B2C1]">{linkedClient.email}</p>
                  </div>
                ) : linkedLead ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#F0B454] font-bold block">PROSPECTO ASOCIADO</span>
                    <Link
                      href="/prospectos"
                      className="font-bold text-xs text-[#F4F7FA] hover:text-[#28B8AA] block transition-colors"
                    >
                      {linkedLead.first_name} {linkedLead.last_name} &rarr;
                    </Link>
                    <p className="text-[10px] text-[#A5B2C1]">Estado: {linkedLead.status}</p>
                    <button
                      onClick={() => setLinkModalOpen(true)}
                      className="text-[11px] text-[#28B8AA] hover:underline font-semibold flex items-center gap-1 mt-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Vincular a Cliente Existente</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-[#A5B2C1]">No vinculado a cliente corporativo.</p>
                    <button
                      onClick={() => setLinkModalOpen(true)}
                      className="crm-button-secondary text-xs py-1.5 px-3 w-full mt-2 flex items-center justify-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Vincular a Cliente</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Oportunidades del Cliente */}
              {clientOpportunities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[#A5B2C1] uppercase font-bold flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#28B8AA]" /> Oportunidades en Curso
                  </span>
                  <div className="space-y-1.5">
                    {clientOpportunities.map((opp) => (
                      <div key={opp.id} className="p-2 rounded bg-[#151F2A] border border-[#30404E] text-[11px]">
                        <div className="font-semibold text-[#F4F7FA]">{opp.title}</div>
                        <div className="text-[10px] text-[#28B8AA] font-mono font-bold mt-0.5">
                          ${Number(opp.expected_value).toLocaleString()} USD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#A5B2C1] py-8 text-center">Sin selección.</p>
          )}
        </div>
      </div>

      {/* Modal para Vincular Conversación a Cliente Existente */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1118]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E]">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#28B8AA]" />
                <h3 className="font-bold text-sm text-[#F4F7FA]">Vincular a Cliente Corporativo</h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkClient} className="space-y-4 text-xs">
              <p className="text-[#A5B2C1]">
                Seleccione el cliente registrado en el CRM al cual se asignará formalmente este hilo de conversación de Instagram.
              </p>

              <div>
                <label className="block text-[#A5B2C1] font-semibold mb-1">
                  Cliente Registrado *
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="crm-input text-xs w-full"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.identification_type}: {c.identification_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#30404E] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="crm-button-secondary py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedClientId}
                  className="crm-button-primary py-2 px-4"
                >
                  Confirmar Vinculación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
