import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { UserCheck, Clock, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';


export default async function ProspectosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const leads = db.leads.filter((l) => l.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#F4F7FA]">Gestión de Prospectos (Leads)</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
                Fase 2 Comercial
              </span>
            </div>
            <p className="text-xs text-[#A5B2C1] mt-1">
              Registro centralizado de prospectos, captura por fuentes y conversión a clientes.
            </p>
          </div>
        </div>

        {/* Previsualización de Datos Reales en BD */}
        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
            <span className="text-xs font-bold text-[#F4F7FA]">Prospectos Registrados en Base de Datos ({leads.length})</span>
            <span className="text-[10px] text-[#A5B2C1]">Listo para módulo completo en Fase 2</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Prospecto</th>
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Interés Comercial</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Valor Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">{l.first_name} {l.last_name}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{l.company_name || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{l.interest}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B454]/15 text-[#F0B454]">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#28B8AA]">
                      ${l.estimated_value.toLocaleString()} USD
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
