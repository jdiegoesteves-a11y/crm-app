import React from 'react';
import Link from 'next/link';
import { Trash2, ArrowLeft, CheckCircle, ShieldAlert, Mail } from 'lucide-react';

export const metadata = {
  title: 'Instrucciones de Eliminación de Datos de Usuario | CRM Executive',
  description: 'Instrucciones oficiales para solicitar la eliminación de datos de usuario de Meta e Instagram en CRM Executive.',
};

export default function EliminacionDatosPage() {
  const lastUpdated = '18 de Octubre de 2026';

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-6 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F17474] to-[#E6683C] flex items-center justify-center text-white font-bold shadow-lg shadow-[#F17474]/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F4F7FA]">Eliminación de Datos de Usuario</h1>
              <p className="text-xs text-[#94A3B8]">Instrucciones conforme a las Políticas de la Plataforma de Meta • {lastUpdated}</p>
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

        {/* Resumen Requerido por Meta */}
        <div className="p-5 rounded-2xl bg-[#1E293B]/80 border border-[#F17474]/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#F17474] font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Su Derecho a Eliminar sus Datos</span>
          </div>
          <p className="text-[#CBD5E1] leading-relaxed">
            De acuerdo con las Políticas de Datos de Meta Platforms, Inc. y la normativa internacional de protección de datos (GDPR / CCPA / ARCO), cualquier usuario que haya interactuado con <strong>CRM Executive</strong> a través de Instagram Direct o Facebook tiene derecho a solicitar la eliminación completa y definitiva de sus datos personales e historial de mensajería almacenados en nuestros servidores.
          </p>
        </div>

        {/* Pasos para eliminar datos */}
        <div className="space-y-6 text-xs text-[#CBD5E1] leading-relaxed">
          <section className="space-y-3 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              Método 1: Solicitud por Correo Electrónico (Recomendado)
            </h2>
            <p>
              Para solicitar la eliminación inmediata de sus datos personales y conversaciones asociadas:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-[#94A3B8]">
              <li>Envíe un correo electrónico a <strong className="text-[#28B8AA]">soporte@crmexecutive.com</strong>.</li>
              <li>Indique en el asunto: <code>Solicitud de Eliminación de Datos de Instagram</code>.</li>
              <li>En el cuerpo del mensaje, incluya su <strong>nombre de usuario de Instagram</strong> (ej. <code>@su_usuario</code>) o el número de teléfono con el cual interactuó con nuestra cuenta empresarial.</li>
            </ol>
            <p className="pt-2 text-[11px] text-[#A5B2C1]">
              * Nuestro equipo técnico procesará su solicitud dentro de un plazo máximo de <strong>48 horas hábiles</strong> y le responderá con un código de confirmación de purga de datos.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              Método 2: Desvinculación Directa desde su Cuenta de Instagram / Facebook
            </h2>
            <p>
              También puede revocar el acceso de nuestra aplicación directamente desde la configuración de su cuenta de Meta:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-[#94A3B8]">
              <li>Abra la aplicación de <strong>Instagram</strong> o ingrese a <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-[#28B8AA] underline">instagram.com</a>.</li>
              <li>Vaya a <strong>Configuración y privacidad</strong> &gt; <strong>Sitios web y apps</strong> (o <em>Permisos de sitios web</em>).</li>
              <li>En la pestaña <strong>Activas</strong>, localice la aplicación <strong>CRM Executive</strong>.</li>
              <li>Haga clic en <strong>Eliminar</strong> o <strong>Revocar acceso</strong>.</li>
            </ol>
            <p className="pt-2 text-[11px] text-[#A5B2C1]">
              Una vez revocada, Meta notificará a nuestros servidores y sus identificadores de sesión quedarán invalidados de forma permanente.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60">
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#28B8AA]" />
              Qué Datos se Eliminan
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#94A3B8]">
              <li>Identificador IGSID asociado a su perfil de Instagram.</li>
              <li>Historial de mensajes de texto y archivos multimedia enviados o recibidos en el CRM.</li>
              <li>Ficha de contacto y prospecto comercial vinculada, salvo obligaciones fiscales o legales vigentes.</li>
              <li>Tokens de acceso y registros temporales de sesión.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#334155] text-center text-[11px] text-[#64748B] flex flex-wrap justify-center gap-6">
          <Link href="/privacidad" className="hover:text-[#94A3B8] transition-colors">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:text-[#94A3B8] transition-colors">Condiciones de Servicio</Link>
          <span>© 2026 CRM Executive. Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  );
}
