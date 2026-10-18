import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';


export default async function ActividadesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const activities = db.activities.filter((a) => a.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Actividades y Seguimientos</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 3 Productividad
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Llamadas, reuniones, tareas y visitas comerciales con alertas automáticas.
          </p>
        </div>

        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
            <span className="text-xs font-bold text-[#F4F7FA]">Actividades Registradas ({activities.length})</span>
            <span className="text-[10px] text-[#A5B2C1]">Fase 3: Productividad</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Título / Asunto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Vencimiento</th>
                  <th className="py-2.5 px-3">Prioridad</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">{a.title}</td>
                    <td className="py-2.5 px-3 text-[#28B8AA] uppercase text-[10px] font-bold">{a.type}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{new Date(a.due_date).toLocaleDateString('es-EC')}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0B454]/15 text-[#F0B454]">
                        {a.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'completada' ? 'bg-[#34C48A]/15 text-[#34C48A]' : 'bg-[#202C39] text-[#A5B2C1]'
                        }`}
                      >
                        {a.status}
                      </span>
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
