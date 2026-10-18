import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | CRM Executive',
  description: 'Política de privacidad oficial y tratamiento de datos personales para CRM Executive y sus integraciones con Meta e Instagram.',
};

export default function PrivacidadPage() {
  const lastUpdated = '18 de Octubre de 2026';

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-6 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#28B8AA] to-[#34C48A] flex items-center justify-center text-[#0F172A] font-bold shadow-lg shadow-[#28B8AA]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F4F7FA]">Política de Privacidad</h1>
              <p className="text-xs text-[#94A3B8]">CRM Executive • Última actualización: {lastUpdated}</p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-[#28B8AA] hover:text-[#34C48A] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
        </div>

        {/* Resumen para Meta Platform Review */}
        <div className="p-5 rounded-2xl bg-[#1E293B]/80 border border-[#28B8AA]/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#28B8AA] font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Compromiso de Privacidad y Cumplimiento con Meta</span>
          </div>
          <p className="text-[#CBD5E1] leading-relaxed">
            Esta Política de Privacidad describe cómo <strong>CRM Executive</strong> recopila, utiliza y protege la información del usuario a través de nuestra plataforma y nuestras integraciones oficiales con las APIs de Meta (Instagram Graph API, WhatsApp Business API y Facebook Login). No vendemos ni compartimos sus datos personales con terceros para fines publicitarios.
          </p>
        </div>

        {/* Secciones Legales */}
        <div className="space-y-6 text-xs text-[#CBD5E1] leading-relaxed">
          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              1. Responsable del Tratamiento
            </h2>
            <p>
              El responsable del tratamiento de los datos recabados a través de la plataforma es <strong>CRM Executive</strong>. Si tiene cualquier duda respecto a esta política o desea ejercer sus derechos de privacidad, puede contactarnos a través de los canales indicados al final de este documento.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              2. Información que Recopilamos
            </h2>
            <p>
              Para prestar los servicios de gestión comercial, seguimiento de clientes y atención omnicanal, recopilamos la siguiente información:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li><strong>Datos de cuenta corporativa:</strong> Nombre, correo electrónico, cargo y contraseña encriptada de los agentes comerciales.</li>
              <li><strong>Datos de prospectos y clientes:</strong> Nombre, teléfono, correo electrónico, empresa y notas de seguimiento registradas por los asesores.</li>
              <li><strong>Datos de mensajería (Meta / Instagram):</strong> Identificador externo de usuario (IGSID), nombre de usuario público, contenido de mensajes directos e historial de conversaciones recibidas exclusivamente cuando un usuario contacta a la empresa por Instagram o WhatsApp.</li>
            </ul>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              3. Finalidad del Tratamiento
            </h2>
            <p>
              Los datos personales recolectados se utilizan única y exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li>Permitir a los asesores comerciales responder las consultas y solicitudes enviadas por los clientes a través de Instagram y WhatsApp.</li>
              <li>Crear y gestionar el pipeline de prospectos y cotizaciones comerciales.</li>
              <li>Cumplir con las obligaciones contractuales y de servicio acordadas con el cliente.</li>
              <li>Mantener registros de auditoría y trazabilidad de las acciones comerciales dentro del CRM.</li>
            </ul>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              4. Integración y Uso de APIs de Meta Platforms, Inc.
            </h2>
            <p>
              Nuestra aplicación utiliza las APIs oficiales de Meta con los permisos autorizados por el usuario:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li><code>instagram_business_basic</code>: Para consultar el perfil comercial básico de la cuenta conectada.</li>
              <li><code>instagram_business_manage_messages</code>: Para recibir notificaciones en tiempo real vía Webhooks HTTPS de nuevos mensajes entrantes y permitir a los asesores responder directamente desde la interfaz del CRM.</li>
            </ul>
            <p className="mt-2">
              No compartimos, transferimos ni vendemos datos de la API de Meta a redes publicitarias, corredores de datos ni a ningún intermediario externo.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              5. Seguridad y Conservación de Datos
            </h2>
            <p>
              Implementamos rigurosas medidas de seguridad técnicas y organizativas, incluyendo cifrado en tránsito (HTTPS / TLS 1.3), cifrado de contraseñas con bcrypt, validación criptográfica HMAC-SHA256 de webhooks entrantes y políticas de control de acceso basadas en roles (RBAC). Los datos se conservan únicamente durante el tiempo necesario para la prestación del servicio comercial.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              6. Eliminación de Datos del Usuario (Data Deletion)
            </h2>
            <p>
              Cualquier usuario de Instagram o cliente registrado puede solicitar la eliminación total de sus datos personales y conversaciones almacenadas en cualquier momento. Consulte nuestras instrucciones en{' '}
              <Link href="/eliminacion-datos" className="text-[#28B8AA] underline font-semibold hover:text-[#34C48A]">
                Instrucciones de Eliminación de Datos de Usuario
              </Link>.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              7. Contacto
            </h2>
            <p>
              Para cualquier consulta o solicitud de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), comuníquese a:
            </p>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-[#334155] font-mono text-[11px] text-[#28B8AA]">
              soporte@crmexecutive.com • Asunto: Privacidad y Tratamiento de Datos
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#334155] text-center text-[11px] text-[#64748B] flex flex-wrap justify-center gap-6">
          <Link href="/terminos" className="hover:text-[#94A3B8] transition-colors">Condiciones de Servicio</Link>
          <Link href="/eliminacion-datos" className="hover:text-[#94A3B8] transition-colors">Eliminación de Datos</Link>
          <span>© 2026 CRM Executive. Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  );
}
