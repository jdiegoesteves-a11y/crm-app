import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle, AlertCircle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Condiciones de Servicio | CRM Executive',
  description: 'Condiciones de servicio y términos de uso oficiales para CRM Executive y sus integraciones con Meta e Instagram.',
};

export default function TerminosPage() {
  const lastUpdated = '18 de Octubre de 2026';

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-6 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#28B8AA] to-[#34C48A] flex items-center justify-center text-[#0F172A] font-bold shadow-lg shadow-[#28B8AA]/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F4F7FA]">Condiciones de Servicio</h1>
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

        {/* Resumen */}
        <div className="p-5 rounded-2xl bg-[#1E293B]/80 border border-[#28B8AA]/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#28B8AA] font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Términos y Condiciones de Uso</span>
          </div>
          <p className="text-[#CBD5E1] leading-relaxed">
            Al acceder, registrarse o utilizar <strong>CRM Executive</strong> o cualquiera de sus módulos de integración con Meta e Instagram, usted acepta vincularse legalmente por estos términos. Si no está de acuerdo con alguna cláusula, debe abstenerse de utilizar la plataforma.
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-6 text-xs text-[#CBD5E1] leading-relaxed">
          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              1. Descripción del Servicio
            </h2>
            <p>
              CRM Executive es una solución de software empresarial diseñada para la gestión comercial, administración de prospectos (leads), seguimiento de cotizaciones y atención omnicanal de mensajes a través de canales digitales como Instagram Direct y WhatsApp.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              2. Uso Aceptable y Restricciones
            </h2>
            <p>
              El usuario se compromete a utilizar la plataforma conforme a la legislación aplicable y a las Políticas de la Plataforma de Meta. Queda expresamente prohibido:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li>Enviar mensajes no solicitados (spam) masivo a través de los canales conectados.</li>
              <li>Intentar eludir las limitaciones de acceso, autenticación o seguridad de la plataforma o de las APIs de terceros.</li>
              <li>Utilizar el servicio para fines fraudulentos, difamatorios o que violen derechos de propiedad intelectual de terceros.</li>
            </ul>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              3. Integraciones de Terceros (Meta Platforms, Inc.)
            </h2>
            <p>
              Nuestra plataforma interactúa con servicios proporcionados por Meta Platforms, Inc. (Instagram Graph API). El usuario reconoce y acepta que:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li>El uso de las funciones de mensajería está sujeto a los Términos de la Plataforma de Meta y las Políticas para Desarrolladores de Meta.</li>
              <li>Meta puede aplicar ventanas de mensajería (ej. ventana estándar de 24 horas para respuesta de agentes comerciales).</li>
              <li>CRM Executive no se hace responsable por interrupciones, cambios en las APIs o cancelaciones de servicio ocasionadas por Meta.</li>
            </ul>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              4. Cuentas y Seguridad de Acceso
            </h2>
            <p>
              Los administradores son responsables de salvaguardar las credenciales de acceso de sus usuarios corporativos. Cualquier actividad realizada desde una cuenta autorizada será atribuible a la organización correspondiente.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              5. Limitación de Responsabilidad
            </h2>
            <p>
              El servicio se provee "tal cual" y según disponibilidad. CRM Executive no garantiza que el servicio esté libre de errores ininterrumpidos, aunque implementará sus mejores esfuerzos técnicos para garantizar alta disponibilidad y seguridad de la información.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              6. Modificaciones de los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento para reflejar actualizaciones legales, operativas o cambios en las políticas de proveedores externos. El uso continuo de la plataforma constituye aceptación de las modificaciones.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              7. Contacto Legal
            </h2>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-[#334155] font-mono text-[11px] text-[#28B8AA]">
              soporte@crmexecutive.com • Asunto: Condiciones de Servicio y Términos Legales
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#334155] text-center text-[11px] text-[#64748B] flex flex-wrap justify-center gap-6">
          <Link href="/privacidad" className="hover:text-[#94A3B8] transition-colors">Política de Privacidad</Link>
          <Link href="/eliminacion-datos" className="hover:text-[#94A3B8] transition-colors">Eliminación de Datos</Link>
          <span>© 2026 CRM Executive. Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  );
}
