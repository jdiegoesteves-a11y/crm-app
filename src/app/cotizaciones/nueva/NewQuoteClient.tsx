'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Client,
  Opportunity,
  Product,
  SessionUser,
} from '@/types/database';
import {
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
} from 'lucide-react';
import { createQuoteAction, CreateQuoteItemInput } from '@/app/actions/quotes';

interface NewQuoteClientProps {
  clients: Client[];
  opportunities: Opportunity[];
  products: Product[];
  currentUser: SessionUser;
}

interface QuoteLineItem extends CreateQuoteItemInput {
  tempId: string;
}

export function NewQuoteClient({
  clients,
  opportunities,
  products,
  currentUser,
}: NewQuoteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams?.get('clientId') || (clients[0]?.id ?? '');

  const [clientId, setClientId] = useState(initialClientId);
  const [opportunityId, setOpportunityId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(
    'Forma de pago: 50% anticipo al ordenar y 50% contra entrega a satisfacción.'
  );
  const [terms, setTerms] = useState(
    '1. Precios expresados en USD. No incluye retenciones en la fuente.\n2. Oferta válida por 30 días calendario a partir de su emisión.\n3. Soporte técnico y garantía según póliza comercial adjunta.'
  );

  // Items de cotización
  const [items, setItems] = useState<QuoteLineItem[]>([
    {
      tempId: 'line-1',
      product_id: products[0]?.id || undefined,
      description: products[0]
        ? `${products[0].name} — ${products[0].description || ''}`
        : 'Consultoría e Implementación Técnica',
      quantity: 1,
      unit_price: products[0]?.unit_price || 1500,
      discount_percent: 0,
      tax_rate: 15.00,
    },
  ]);

  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Oportunidades del cliente seleccionado
  const clientOpportunities = opportunities.filter((o) => o.client_id === clientId);

  // Cálculos dinámicos
  let subtotalCalculado = 0;
  let descuentoTotalCalculado = 0;
  let ivaTotalCalculado = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const disc = Number(item.discount_percent) || 0;
    const tax = Number(item.tax_rate) || 0;

    const base = qty * price;
    const discountVal = base * (disc / 100);
    const lineSubtotal = base - discountVal;
    const taxVal = lineSubtotal * (tax / 100);

    subtotalCalculado += lineSubtotal;
    descuentoTotalCalculado += discountVal;
    ivaTotalCalculado += taxVal;
  });

  const granTotalCalculado = subtotalCalculado + ivaTotalCalculado;

  // Agregar línea manual
  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `line-${Date.now()}`,
        product_id: undefined,
        description: '',
        quantity: 1,
        unit_price: 100,
        discount_percent: 0,
        tax_rate: 15.00,
      },
    ]);
  };

  // Agregar producto desde catálogo
  const handleSelectProduct = (prod: Product) => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `line-${Date.now()}`,
        product_id: prod.id,
        description: `${prod.name}${prod.description ? ` - ${prod.description}` : ''}`,
        quantity: 1,
        unit_price: prod.unit_price,
        discount_percent: 0,
        tax_rate: prod.tax_rate ?? 15.00,
      },
    ]);
    setCatalogModalOpen(false);
  };

  const handleRemoveLine = (tempId: string) => {
    if (items.length <= 1) {
      alert('La cotización debe contener al menos un ítem.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleItemChange = (tempId: string, field: keyof CreateQuoteItemInput, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i))
    );
  };

  // Guardar y Emitir
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientId) {
      setErrorMsg('Debe seleccionar un cliente destinatario.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      setErrorMsg('Todos los ítems deben tener una descripción válida.');
      return;
    }

    setLoading(true);
    try {
      const res = await createQuoteAction({
        client_id: clientId,
        opportunity_id: opportunityId || undefined,
        issue_date: issueDate,
        valid_until: validUntil,
        notes,
        terms_conditions: terms,
        items: items.map((i) => ({
          product_id: i.product_id,
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount_percent: Number(i.discount_percent),
          tax_rate: Number(i.tax_rate),
        })),
      });

      if (res.success && res.quoteId) {
        router.push(`/cotizaciones/${res.quoteId}`);
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar la cotización.');
        setLoading(false);
      }
    } catch {
      setErrorMsg('Error de red al procesar la cotización.');
      setLoading(false);
    }
  };

  const filteredCatalog = products.filter(
    (p) =>
      p.is_active &&
      (p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Barra Superior con Navegación y Guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cotizaciones"
            className="p-2 rounded-lg bg-[#202C39] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#F4F7FA]">Nueva Cotización Comercial</h1>
            <p className="text-xs text-[#A5B2C1]">
              Construye la propuesta formal y genera el PDF corporativo para el cliente.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="crm-button-primary text-xs py-2.5 px-5 flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-[#0B1118] rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Generando Cotización...' : 'Guardar y Emitir Cotización'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#F17474]/10 border border-[#F17474]/30 text-[#F17474] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjeta: Datos Generales y Cliente */}
      <div className="crm-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#F4F7FA] border-b border-[#30404E] pb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#28B8AA]" />
          <span>Información de la Propuesta</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Cliente Destinatario *
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setOpportunityId('');
              }}
              required
              className="crm-input text-xs w-full"
            >
              <option value="" disabled>Seleccione un cliente registrado...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.identification_type}: {c.identification_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Oportunidad Vinculada (Opcional)
            </label>
            <select
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              className="crm-input text-xs w-full"
            >
              <option value="">Sin oportunidad vinculada</option>
              {clientOpportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} (${Number(o.expected_value).toLocaleString()} USD)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Fecha de Emisión *
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="crm-input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Válido Hasta *
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
              className="crm-input text-xs w-full"
            />
          </div>
        </div>
      </div>

      {/* Tarjeta: Constructor de Ítems */}
      <div className="crm-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#30404E] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#28B8AA]" />
              <span>Desglose de Bienes y Servicios</span>
            </h2>
            <p className="text-[11px] text-[#A5B2C1]">
              Agrega productos del catálogo oficial o detalla servicios a la medida.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCatalogModalOpen(true)}
              className="crm-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#28B8AA]" />
              <span>Cargar de Catálogo</span>
            </button>
            <button
              type="button"
              onClick={handleAddLine}
              className="crm-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Línea Manual</span>
            </button>
          </div>
        </div>

        {/* Tabla de ítems dinámicos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#202C39] text-[#A5B2C1] text-[10px] uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3 w-1/3">Descripción del Bien / Servicio</th>
                <th className="py-2.5 px-2 text-center w-20">Cant.</th>
                <th className="py-2.5 px-2 text-right w-28">Precio Unit. ($)</th>
                <th className="py-2.5 px-2 text-center w-20">Desc %</th>
                <th className="py-2.5 px-2 text-center w-20">IVA %</th>
                <th className="py-2.5 px-3 text-right w-28">Total Línea ($)</th>
                <th className="py-2.5 px-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unit_price) || 0;
                const disc = Number(item.discount_percent) || 0;
                const lineBase = qty * price;
                const lineDisc = lineBase * (disc / 100);
                const lineSubtotal = lineBase - lineDisc;

                return (
                  <tr key={item.tempId} className="hover:bg-[#202C39]/30">
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Descripción detallada del servicio o entregable..."
                        value={item.description}
                        onChange={(e) => handleItemChange(item.tempId, 'description', e.target.value)}
                        required
                        className="crm-input text-xs w-full py-1.5"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.tempId, 'quantity', e.target.value)}
                        required
                        className="crm-input text-xs w-full py-1.5 text-center"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.tempId, 'unit_price', e.target.value)}
                        required
                        className="crm-input text-xs w-full py-1.5 text-right font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.discount_percent}
                        onChange={(e) => handleItemChange(item.tempId, 'discount_percent', e.target.value)}
                        className="crm-input text-xs w-full py-1.5 text-center font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={item.tax_rate}
                        onChange={(e) => handleItemChange(item.tempId, 'tax_rate', e.target.value)}
                        className="crm-input text-xs w-full py-1.5 text-center font-mono"
                      >
                        <option value="15.00">15%</option>
                        <option value="0.00">0%</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F4F7FA]">
                      ${lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(item.tempId)}
                        className="p-1 rounded text-[#A5B2C1] hover:text-[#F17474] hover:bg-[#202C39] transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero en Vivo */}
        <div className="flex flex-col sm:flex-row justify-end pt-4 border-t border-[#30404E]">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[#A5B2C1]">
              <span>Subtotal Neto:</span>
              <span className="font-mono text-[#F4F7FA]">
                ${subtotalCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            {descuentoTotalCalculado > 0 && (
              <div className="flex justify-between text-[#34C48A]">
                <span>Descuento Comercial:</span>
                <span className="font-mono">
                  -${descuentoTotalCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            )}

            <div className="flex justify-between text-[#A5B2C1]">
              <span>IVA Aplicado (15%):</span>
              <span className="font-mono text-[#F4F7FA]">
                ${ivaTotalCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="pt-2 border-t border-[#30404E] flex justify-between items-center bg-[#28B8AA]/10 p-2.5 rounded-lg border border-[#28B8AA]/30">
              <span className="font-bold text-[#F4F7FA]">TOTAL A FACTURAR:</span>
              <span className="font-mono font-bold text-base text-[#28B8AA]">
                ${granTotalCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta: Condiciones Comerciales y Notas */}
      <div className="crm-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#F4F7FA] border-b border-[#30404E] pb-2">
          Cláusulas y Condiciones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Términos y Condiciones de la Oferta
            </label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="crm-input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B2C1] mb-1.5">
              Notas Comerciales / Forma de Pago
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="crm-input text-xs w-full"
            />
          </div>
        </div>
      </div>

      {/* Modal Selector de Catálogo */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1118]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="font-bold text-sm text-[#F4F7FA]">Seleccionar Producto del Catálogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-sm"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoría..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="crm-input text-xs w-full"
              autoFocus
            />

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCatalog.length === 0 ? (
                <p className="text-xs text-center text-[#A5B2C1] py-8">
                  No se encontraron productos activos que coincidan.
                </p>
              ) : (
                filteredCatalog.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-3 rounded-lg bg-[#202C39] hover:bg-[#28B8AA]/15 border border-[#30404E] hover:border-[#28B8AA]/50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#F4F7FA] group-hover:text-[#28B8AA]">
                          {prod.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151F2A] text-[#A5B2C1] border border-[#30404E]">
                          {prod.sku}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A5B2C1] line-clamp-1 mt-0.5">
                        {prod.description || `Categoría: ${prod.category}`}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <div className="font-mono font-bold text-xs text-[#F4F7FA]">
                        ${Number(prod.unit_price).toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-[#28B8AA]">IVA {prod.tax_rate}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#30404E] flex justify-end">
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="crm-button-secondary text-xs py-2 px-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
