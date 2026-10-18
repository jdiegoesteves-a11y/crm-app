import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { Building, Users, Shield, Clock, DollarSign, Database, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';


export default async function ConfiguracionPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (!['admin', 'gerente'].includes(session.role)) {
    redirect('/dashboard?error=no_autorizado');
  }

  const db = dbManager.getDb();
  const org = db.organizations.find((o) => o.id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FA]">Configuración del Sistema</h1>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Parámetros de la organización, moneda, zona horaria y administración de accesos.
          </p>
        </div>

        {/* Tarjetas de Accesos Rápidos de Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/configuracion/usuarios"
            className="crm-card p-5 hover:border-[#28B8AA] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#28B8AA]/15 text-[#28B8AA] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F4F7FA] group-hover:text-[#28B8AA] transition-colors">
                Usuarios y Permisos (RBAC)
              </h3>
              <p className="text-xs text-[#A5B2C1] mt-1 leading-relaxed">
                Administración de cuentas, asignación de roles (Admin, Gerente, Vendedor, Consulta) y estados de acceso.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#28B8AA] mt-4 flex items-center gap-1">
              Gestionar {db.profiles.length} usuarios &rarr;
            </div>
          </Link>

          <div className="crm-card p-5">
            <div className="w-10 h-10 rounded-xl bg-[#202C39] text-[#28B8AA] flex items-center justify-center mb-4 border border-[#30404E]">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F4F7FA]">Datos de la Organización</h3>
            <p className="text-xs text-[#A5B2C1] mt-1 leading-relaxed">
              Razón social, RUC tributario y parámetros regionales.
            </p>
            <div className="mt-4 pt-3 border-t border-[#30404E] text-xs space-y-1 text-[#A5B2C1]">
              <div>Razón: <strong className="text-[#F4F7FA]">{org?.name}</strong></div>
              <div>RUC: <strong className="text-[#F4F7FA]">{org?.tax_id}</strong></div>
            </div>
          </div>

          <div className="crm-card p-5">
            <div className="w-10 h-10 rounded-xl bg-[#34C48A]/15 text-[#34C48A] flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F4F7FA]">Parámetros Comerciales</h3>
            <p className="text-xs text-[#A5B2C1] mt-1 leading-relaxed">
              Moneda predeterminada e impuestos vigentes.
            </p>
            <div className="mt-4 pt-3 border-t border-[#30404E] text-xs space-y-1 text-[#A5B2C1]">
              <div>Moneda: <strong className="text-[#28B8AA]">{org?.currency} (Dólar estadounidense)</strong></div>
              <div>Zona Horaria: <strong className="text-[#F4F7FA]">{org?.timezone}</strong></div>
              <div>IVA Estándar: <strong className="text-[#F4F7FA]">15%</strong></div>
            </div>
          </div>
        </div>

        {/* Bitácora de Auditoría Inmutable */}
        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#30404E] mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#28B8AA]" />
              <h2 className="text-base font-bold text-[#F4F7FA]">Registro de Auditoría y Trazabilidad (Audit Logs)</h2>
            </div>
            <span className="text-[10px] bg-[#28B8AA]/15 text-[#28B8AA] px-2 py-0.5 rounded font-bold">
              {db.audit_logs.length} eventos registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Acción Registrada</th>
                  <th className="py-2.5 px-3">Usuario Responsable</th>
                  <th className="py-2.5 px-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {db.audit_logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 text-[#A5B2C1] font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('es-EC')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#28B8AA]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-[#F4F7FA]">
                      {log.user_email || 'Sistema'}
                    </td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
