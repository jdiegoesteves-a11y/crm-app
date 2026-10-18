import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';


export default async function ClientesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const clients = db.clients.filter((c) => c.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Directorio de Clientes y Empresas</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 2 Comercial
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Registro 360° de personas y empresas con historial de compras, contactos y documentos.
          </p>
        </div>

        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
            <span className="text-xs font-bold text-[#F4F7FA]">Empresas y Clientes Registrados ({clients.length})</span>
            <span className="text-[10px] text-[#A5B2C1]">Fase 2: Ficha 360° y relaciones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Razón Social / Nombre</th>
                  <th className="py-2.5 px-3">Identificación (RUC)</th>
                  <th className="py-2.5 px-3">Industria</th>
                  <th className="py-2.5 px-3">Ciudad</th>
                  <th className="py-2.5 px-3">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">{c.name}</td>
                    <td className="py-2.5 px-3 text-[#28B8AA] font-mono">{c.identification_number}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{c.industry || 'General'}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{c.city || 'Quito'}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{c.email}</td>
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
