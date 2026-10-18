import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';


export default async function EmbudoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const stages = db.pipeline_stages.filter((s) => s.organization_id === session.organization_id);
  const opportunities = db.opportunities.filter((o) => o.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Embudo Comercial (Pipeline Kanban)</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 2 Comercial
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Tablero interactivo con 7 etapas configurables, drag-and-drop y cálculo de probabilidades.
          </p>
        </div>

        {/* Columnas Kanban Previsualizadas con Datos Reales */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeals = opportunities.filter((o) => o.stage_id === stage.id);
            const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.expected_value), 0);

            return (
              <div key={stage.id} className="crm-card p-3 min-w-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#30404E]">
                    <span className="text-xs font-bold text-[#F4F7FA] truncate">{stage.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#202C39] text-[#28B8AA]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#A5B2C1] mt-1">
                    Prob: {stage.probability}% • ${stageValue.toLocaleString()} USD
                  </div>

                  <div className="mt-3 space-y-2">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="p-2.5 rounded-lg bg-[#202C39] border border-[#30404E] text-xs">
                        <div className="font-semibold text-[#F4F7FA] line-clamp-1">{deal.title}</div>
                        <div className="text-[11px] font-bold text-[#28B8AA] mt-1">
                          ${Number(deal.expected_value).toLocaleString()} USD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
