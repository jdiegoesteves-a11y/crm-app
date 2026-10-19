'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChannelIntegration, SessionUser } from '@/types/database';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  LogOut,
  Key,
  Globe,
  Radio,
  Clock,
  Layers,
  MessageSquare,
  Sparkles,
  Send,
} from 'lucide-react';
import { disconnectInstagramAction, manualSaveInstagramTokenAction, simulateIncomingTestMessageAction } from '@/app/actions/messages';

interface InstagramIntegrationClientProps {
  integration: ChannelIntegration | null;
  currentUser: SessionUser;
  appId: string;
  verifyToken: string;
  baseUrl: string;
}

export function InstagramIntegrationClient({
  integration: initialIntegration,
  currentUser,
  appId,
  verifyToken,
  baseUrl,
}: InstagramIntegrationClientProps) {
  const searchParams = useSearchParams();
  const successParam = searchParams?.get('success');
  const errorParam = searchParams?.get('error');

  const [integration, setIntegration] = useState<ChannelIntegration | null>(initialIntegration);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    successParam
      ? { type: 'success', text: 'Cuenta de Instagram conectada exitosamente.' }
      : errorParam
      ? { type: 'error', text: decodeURIComponent(errorParam) }
      : null
  );

  // Modal para configuración manual de token (útil para pruebas / sandbox)
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualUsername, setManualUsername] = useState(integration?.account_username || '');
  const [manualUserId, setManualUserId] = useState(integration?.account_id || '');

  const webhookCallbackUrl = `${baseUrl}/api/webhooks/instagram`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Está seguro de desconectar la cuenta de Instagram? Los mensajes directos dejarán de recibirse hasta que vuelva a autorizarla.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await disconnectInstagramAction();
      if (res.success) {
        setIntegration((prev) => (prev ? { ...prev, status: 'desconectado', access_token: undefined } : null));
        setFeedback({ type: 'success', text: 'Cuenta de Instagram desconectada.' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al desconectar' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    try {
      const res = await manualSaveInstagramTokenAction(manualToken, manualUsername, manualUserId);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Token de acceso guardado y cuenta configurada.' });
        setManualModalOpen(false);
        window.location.reload();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al guardar credenciales' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al conectar con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const [testLoading, setTestLoading] = useState(false);

  const handleSimulateTestMessage = async () => {
    setTestLoading(true);
    try {
      const res = await simulateIncomingTestMessageAction(
        integration?.account_username ? `cliente_de_${integration.account_username}` : 'cliente_demo_ig',
        '¡Hola! Estoy interesado en sus servicios. ¿Me podrían dar una cotización? (Mensaje de Prueba)'
      );
      if (res.success) {
        setFeedback({
          type: 'success',
          text: '✅ Mensaje de prueba simulado con éxito. Se creó automáticamente el prospecto y la conversación en la bandeja de entrada.',
        });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al simular mensaje' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al enviar simulación' });
    } finally {
      setTestLoading(false);
    }
  };

  const isConnected = integration?.status === 'conectado';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navegación y Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/configuracion"
            className="p-2 rounded-lg bg-[#202C39] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F4F7FA]">Integración Oficial de Instagram</h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isConnected
                    ? 'bg-[#34C48A]/15 text-[#34C48A] border-[#34C48A]/30'
                    : 'bg-[#F0B454]/15 text-[#F0B454] border-[#F0B454]/30'
                }`}
              >
                {isConnected ? 'Conectado y Operativo' : 'Desconectado / Pendiente'}
              </span>
            </div>
            <p className="text-xs text-[#A5B2C1]">
              Meta for Developers • Instagram API with Instagram Login
            </p>
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <>
                <Link
                  href="/mensajes"
                  className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ir a Bandeja de Mensajes</span>
                </Link>

                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-[#F17474] hover:text-[#F17474]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar Cuenta</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(true)}
                  className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-[#28B8AA] hover:text-[#28B8AA] border-[#28B8AA]/30"
                  title="Conectar directamente con Token de Meta"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Configurar con Access Token</span>
                </button>

                <a
                  href="/api/integrations/instagram/authorize"
                  className="crm-button-primary text-xs py-2 px-4 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Conectar con Instagram Login</span>
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
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

      {/* Consola de Operación de Mensajería en Vivo */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E293B] to-[#151F2A] border border-[#28B8AA]/30 text-xs space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#28B8AA] font-bold">
            <Radio className="w-4 h-4 text-[#34C48A] animate-pulse" />
            <span className="text-sm text-[#F4F7FA]">Canal de Mensajería Directa Oficial de Instagram</span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isConnected
                ? 'bg-[#34C48A]/15 text-[#34C48A] border-[#34C48A]/30'
                : 'bg-[#F0B454]/15 text-[#F0B454] border-[#F0B454]/30'
            }`}
          >
            {isConnected ? '● Operativo en Vivo' : '○ Requiere Conexión'}
          </span>
        </div>
        <p className="text-[#A5B2C1] leading-relaxed">
          Los mensajes directos enviados por los clientes a tu cuenta de Instagram se reciben de inmediato a través de los Webhooks de Meta, creando automáticamente la conversación y el prospecto (lead) comercial en tu bandeja de entrada.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/mensajes"
            className="crm-button-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Abrir Bandeja de Mensajería Omnicanal</span>
          </Link>

          {!isConnected && (
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-2 text-[#28B8AA]"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ingresar Token de Acceso</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta Informativa sobre Modo Desarrollo vs Producción */}
      <div className="p-4 rounded-xl bg-[#202C39] border border-[#30404E] text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#F0B454] font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Información de Acceso y Modo de Aplicación en Meta</span>
        </div>
        <p className="text-[#A5B2C1] leading-relaxed">
          La aplicación <strong>CRM Executive-IG</strong> (App ID: <code>{appId}</code>) opera bajo{' '}
          <strong className="text-[#F4F7FA]">Acceso Estándar / Modo Desarrollo</strong> en Meta for Developers. En este nivel, la mensajería solo está autorizada con cuentas de Instagram agregadas en los roles de prueba de su aplicación. Para interactuar con cuentas del público general sin roles, Meta requiere someter la app a <strong>App Review</strong> para los permisos <code>instagram_business_basic</code> e <code>instagram_business_manage_messages</code>.
        </p>
      </div>

      {/* Grid de Estado de la Integración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tarjeta: Datos de la Aplicación en Meta */}
        <div className="crm-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#F4F7FA] border-b border-[#30404E] pb-2 flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#28B8AA]" />
            <span>Parámetros de la Aplicación en Meta</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Nombre de la Aplicación:</span>
              <span className="font-bold text-[#F4F7FA]">CRM Executive-IG</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Instagram App ID:</span>
              <span className="font-mono font-bold text-[#28B8AA]">{appId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Tipo de Integración:</span>
              <span className="text-[#F4F7FA]">Instagram API with Instagram Login</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Permisos Configurados:</span>
              <span className="text-[#28B8AA] font-mono text-[11px]">
                basic, manage_messages
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#A5B2C1]">Estado de Autorización:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isConnected
                    ? 'bg-[#34C48A]/15 text-[#34C48A]'
                    : 'bg-[#F0B454]/15 text-[#F0B454]'
                }`}
              >
                {isConnected ? 'Autorizado (Activo)' : 'No Autorizado'}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta: Cuenta Profesional Conectada */}
        <div className="crm-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#F4F7FA] border-b border-[#30404E] pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#28B8AA]" />
            <span>Cuenta Profesional de Instagram</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Cuenta Conectada:</span>
              <span className="font-bold text-[#F4F7FA]">
                {integration?.account_username ? `@${integration.account_username}` : 'Ninguna'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Instagram User ID:</span>
              <span className="font-mono text-[#F4F7FA]">
                {integration?.account_id || 'No asignado'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Vigencia del Token:</span>
              <span className="text-[#A5B2C1]">
                {integration?.token_expires_at
                  ? `Expira el ${new Date(integration.token_expires_at).toLocaleDateString('es-EC')}`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#30404E]/40">
              <span className="text-[#A5B2C1]">Última Sincronización:</span>
              <span className="text-[#A5B2C1]">
                {integration?.last_sync_at
                  ? new Date(integration.last_sync_at).toLocaleString('es-EC')
                  : 'Sin sincronizaciones previas'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#A5B2C1]">Errores Reportados:</span>
              <span className="text-[#34C48A] font-medium">
                {integration?.last_error ? (
                  <span className="text-[#F17474]">{integration.last_error}</span>
                ) : (
                  'Ninguno (Conexión saludable)'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta: Configuración de Webhook en Meta */}
      <div className="crm-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#30404E] pb-2">
          <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#28B8AA]" />
            <span>Configuración de Webhooks en Meta for Developers</span>
          </h2>
          <span className="text-[10px] text-[#28B8AA] font-mono font-bold bg-[#28B8AA]/10 px-2 py-0.5 rounded">
            HTTPS Callback
          </span>
        </div>

        <p className="text-xs text-[#A5B2C1] leading-relaxed">
          Copie estos dos valores exactamente en el producto <strong>Webhooks</strong> de su aplicación en Meta for Developers:
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A5B2C1] font-semibold mb-1">
              1. URL de Callback (Callback URL):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookCallbackUrl}
                className="crm-input font-mono text-xs w-full bg-[#151F2A] text-[#28B8AA]"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookCallbackUrl, 'url')}
                className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-[#34C48A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'url' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[10px] text-[#A5B2C1] mt-1">
              * Para pruebas locales en puerto 3000, recuerde apuntar un túnel HTTPS (ej. Cloudflare Tunnel o ngrok).
            </p>
          </div>

          <div>
            <label className="block text-[#A5B2C1] font-semibold mb-1">
              2. Token de Verificación (Verify Token):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="crm-input font-mono text-xs w-full bg-[#151F2A] text-[#F4F7FA]"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(verifyToken, 'token')}
                className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-[#34C48A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'token' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#30404E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#A5B2C1]">
            <Radio className="w-3.5 h-3.5 text-[#34C48A]" />
            <span>Campos a suscribir en Meta: <code>messages</code>, <code>messaging_postbacks</code></span>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setManualModalOpen(true)}
              className="text-[#28B8AA] hover:underline flex items-center gap-1 font-semibold"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configuración Directa de Token Oficial</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para Token Oficial de Instagram */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1118]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#28B8AA]" />
                <h3 className="font-bold text-sm text-[#F4F7FA]">Configuración Oficial de Credenciales</h3>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSave} className="space-y-4 text-xs">
              <p className="text-[#A5B2C1]">
                Ingrese el User Access Token de su cuenta de Instagram generado desde Meta for Developers para activar la conexión en vivo.
              </p>

              <div>
                <label className="block text-[#A5B2C1] font-semibold mb-1">
                  Access Token de Instagram *
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAB..."
                  className="crm-input font-mono text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-semibold mb-1">
                    Nombre de Usuario (@username)
                  </label>
                  <input
                    type="text"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="cuenta_demo"
                    className="crm-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-[#A5B2C1] font-semibold mb-1">
                    Instagram User ID
                  </label>
                  <input
                    type="text"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    placeholder="17841400..."
                    className="crm-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#30404E] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="crm-button-secondary py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="crm-button-primary py-2 px-4"
                >
                  {loading ? 'Guardando...' : 'Guardar y Activar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
