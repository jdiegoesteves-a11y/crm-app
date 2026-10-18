import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';


export default async function CotizacionesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const quotes = db.quotes.filter((q) => q.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Cotizaciones Comerciales</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 4 Operaciones
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Generador dinámico de propuestas y exportador de PDFs ejecutivos.
          </p>
        </div>

        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
            <span className="text-xs font-bold text-[#F4F7FA]">Cotizaciones Emitidas ({quotes.length})</span>
            <span className="text-[10px] text-[#A5B2C1]">Fase 4: Motor de PDF corporativo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Número</th>
                  <th className="py-2.5 px-3">Fecha Emisión</th>
                  <th className="py-2.5 px-3">Validez</th>
                  <th className="py-2.5 px-3">Total (USD)</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#28B8AA]">{q.quote_number}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{q.issue_date}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{q.valid_until}</td>
                    <td className="py-2.5 px-3 font-bold text-[#F4F7FA]">${q.grand_total.toLocaleString()} USD</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34C48A]/15 text-[#34C48A]">
                        {q.status}
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
