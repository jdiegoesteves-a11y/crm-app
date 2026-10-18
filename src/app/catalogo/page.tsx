import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';


export default async function CatalogoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = dbManager.getDb();
  const products = db.products.filter((p) => p.organization_id === session.organization_id);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Catálogo de Productos y Servicios</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B454]/15 text-[#F0B454] border border-[#F0B454]/30">
              Fase 4 Operaciones
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Administración de bienes, servicios, precios unitarios e impuestos configurables.
          </p>
        </div>

        <div className="crm-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
            <span className="text-xs font-bold text-[#F4F7FA]">Ítems en Catálogo ({products.length})</span>
            <span className="text-[10px] text-[#A5B2C1]">Fase 4: Operaciones comerciales</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Código / SKU</th>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Precio Unitario</th>
                  <th className="py-2.5 px-3">IVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30404E]/50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#202C39]/40">
                    <td className="py-2.5 px-3 font-mono text-[#28B8AA]">{p.sku}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">{p.name}</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{p.category}</td>
                    <td className="py-2.5 px-3 font-bold text-[#F4F7FA]">${p.unit_price.toFixed(2)} USD</td>
                    <td className="py-2.5 px-3 text-[#A5B2C1]">{p.tax_rate}%</td>
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
