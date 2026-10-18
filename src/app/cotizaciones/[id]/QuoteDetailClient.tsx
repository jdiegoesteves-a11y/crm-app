'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Quote,
  Client,
  Opportunity,
  QuoteItem,
  Profile,
  SessionUser,
  QuoteStatus,
} from '@/types/database';
import {
  ArrowLeft,
  Download,
  Printer,
  Trash2,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Briefcase,
  User,
  Clock,
  Send,
  XCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { updateQuoteStatusAction, deleteQuoteAction } from '@/app/actions/quotes';

interface QuoteDetailClientProps {
  quote: Quote;
  client: Client;
  opportunity?: Opportunity;
  items: QuoteItem[];
  creator?: Profile;
  currentUser: SessionUser;
}

export function QuoteDetailClient({
  quote: initialQuote,
  client,
  opportunity,
  items,
  creator,
  currentUser,
}: QuoteDetailClientProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const statusConfig: Record<QuoteStatus, { label: string; bg: string; text: string; border: string }> = {
    borrador: { label: 'Borrador', bg: 'bg-[#A5B2C1]/15', text: 'text-[#A5B2C1]', border: 'border-[#A5B2C1]/30' },
    enviada: { label: 'Enviada', bg: 'bg-[#28B8AA]/15', text: 'text-[#28B8AA]', border: 'border-[#28B8AA]/30' },
    aceptada: { label: 'Aceptada', bg: 'bg-[#34C48A]/15', text: 'text-[#34C48A]', border: 'border-[#34C48A]/30' },
    rechazada: { label: 'Rechazada', bg: 'bg-[#F17474]/15', text: 'text-[#F17474]', border: 'border-[#F17474]/30' },
    vencida: { label: 'Vencida', bg: 'bg-[#F0B454]/15', text: 'text-[#F0B454]', border: 'border-[#F0B454]/30' },
  };

  const currentStatus = statusConfig[quote.status] || statusConfig.borrador;

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await updateQuoteStatusAction(quote.id, newStatus);
      if (res.success) {
        setQuote((prev) => ({ ...prev, status: newStatus }));
        setFeedback({ type: 'success', text: `Estado actualizado a "${statusConfig[newStatus].label}".` });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al actualizar estado.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar definitivamente la cotización ${quote.quote_number}?`)) return;
    setLoading(true);
    try {
      const res = await deleteQuoteAction(quote.id);
      if (res.success) {
        router.push('/cotizaciones');
      } else {
        setFeedback({ type: 'error', text: res.error || 'No se pudo eliminar.' });
        setLoading(false);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de red.' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Barra Superior con Navegación y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cotizaciones"
            className="p-2 rounded-lg bg-[#202C39] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-[#28B8AA]">{quote.quote_number}</h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
              >
                {currentStatus.label}
              </span>
            </div>
            <p className="text-xs text-[#A5B2C1]">
              Emitida el {quote.issue_date} • Vence el {quote.valid_until}
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Descarga de PDF */}
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </a>

          {/* Imprimir Vista Web */}
          <Link
            href={`/cotizaciones/${quote.id}/imprimir`}
            target="_blank"
            className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </Link>

          {/* Eliminar (Admin/Gerente) */}
          {['admin', 'gerente'].includes(currentUser.role) && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-[#202C39] hover:bg-[#F17474]/20 text-[#A5B2C1] hover:text-[#F17474] transition-colors"
              title="Eliminar cotización"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[#34C48A]/10 text-[#34C48A] border-[#34C48A]/30'
              : 'bg-[#F17474]/10 text-[#F17474] border-[#F17474]/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-xs opacity-70">
            ✕
          </button>
        </div>
      )}

      {/* Selector de Estado Operativo */}
      {currentUser.role !== 'consulta' && (
        <div className="crm-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#28B8AA]" />
            <span className="text-xs font-bold text-[#F4F7FA]">Transición de Estado Comercial:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'] as QuoteStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={loading || quote.status === st}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all capitalize ${
                  quote.status === st
                    ? 'bg-[#28B8AA] text-[#0B1118] font-bold shadow-md shadow-[#28B8AA]/20'
                    : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA] border border-[#30404E]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Cliente y Asesor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta Cliente */}
        <div className="crm-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#30404E]">
            <span className="text-xs font-bold text-[#A5B2C1] flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#28B8AA]" /> Cliente Destinatario
            </span>
            <Link
              href={`/clientes/${client.id}`}
              className="text-[11px] text-[#28B8AA] hover:underline flex items-center gap-0.5"
            >
              <span>Ver ficha 360°</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#F4F7FA]">{client.name}</h3>
            <p className="text-xs text-[#A5B2C1] mt-0.5">
              {client.identification_type}: {client.identification_number}
            </p>
            <p className="text-xs text-[#A5B2C1]">{client.email} • {client.phone || 'Sin teléfono'}</p>
            {client.address && (
              <p className="text-xs text-[#A5B2C1] mt-1">{client.city} • {client.address}</p>
            )}
          </div>
        </div>

        {/* Tarjeta Oportunidad / Emisor */}
        <div className="crm-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#30404E]">
            <span className="text-xs font-bold text-[#A5B2C1] flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-[#28B8AA]" /> Información de Emisión
            </span>
            <span className="text-[10px] text-[#34C48A] font-mono font-bold">100% AUDITADO</span>
          </div>

          <div className="space-y-1.5 text-xs text-[#A5B2C1]">
            {opportunity && (
              <div className="flex justify-between">
                <span>Oportunidad:</span>
                <span className="font-semibold text-[#F4F7FA]">{opportunity.title}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Asesor Comercial:</span>
              <span className="font-semibold text-[#F4F7FA]">
                {creator ? `${creator.full_name} (${creator.email})` : 'Sistema'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Moneda Oficial:</span>
              <span className="font-semibold text-[#28B8AA]">{quote.currency} (Dólares Americanos)</span>
            </div>
            <div className="flex justify-between">
              <span>ID Transaccional:</span>
              <span className="font-mono text-[10px] text-[#A5B2C1]">{quote.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Ítems */}
      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-[#30404E] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F4F7FA] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#28B8AA]" />
            <span>Detalle de Bienes y Servicios</span>
          </h2>
          <span className="text-xs text-[#A5B2C1]">{items.length} líneas de detalle</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] text-[#A5B2C1] text-[10px] uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Descripción</th>
                <th className="py-2.5 px-2 text-center w-16">Cant.</th>
                <th className="py-2.5 px-3 text-right w-24">Precio Unit.</th>
                <th className="py-2.5 px-2 text-center w-16">Desc %</th>
                <th className="py-2.5 px-2 text-center w-16">IVA %</th>
                <th className="py-2.5 px-3 text-right w-28">Total Línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#202C39]/30">
                  <td className="py-3 px-3 text-center text-[#A5B2C1] font-mono">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-[#F4F7FA]">{item.description}</td>
                  <td className="py-3 px-2 text-center font-mono text-[#F4F7FA]">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#A5B2C1]">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-[#A5B2C1]">
                    {item.discount_percent}%
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-[#A5B2C1]">{item.tax_rate}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#F4F7FA]">
                    ${Number(item.total_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de Totales */}
        <div className="p-5 border-t border-[#30404E] flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-[#A5B2C1]">
              <span>Subtotal:</span>
              <span className="font-mono text-[#F4F7FA]">
                ${Number(quote.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            {quote.discount_total > 0 && (
              <div className="flex justify-between text-[#34C48A]">
                <span>Descuento Comercial:</span>
                <span className="font-mono">
                  -${Number(quote.discount_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            )}

            <div className="flex justify-between text-[#A5B2C1]">
              <span>IVA (15%):</span>
              <span className="font-mono text-[#F4F7FA]">
                ${Number(quote.tax_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="pt-2 border-t border-[#30404E] flex justify-between items-center bg-[#28B8AA]/10 p-3 rounded-lg border border-[#28B8AA]/30">
              <span className="font-bold text-[#F4F7FA]">GRAN TOTAL:</span>
              <span className="font-mono font-bold text-base text-[#28B8AA]">
                ${Number(quote.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Términos y Notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="crm-card p-5 space-y-2">
          <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
            Términos y Condiciones
          </h3>
          <p className="text-xs text-[#A5B2C1] whitespace-pre-line leading-relaxed">
            {quote.terms_conditions || 'Oferta válida por 30 días.'}
          </p>
        </div>

        <div className="crm-card p-5 space-y-2">
          <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
            Notas Comerciales / Forma de Pago
          </h3>
          <p className="text-xs text-[#A5B2C1] whitespace-pre-line leading-relaxed">
            {quote.notes || 'Pago según acuerdo comercial.'}
          </p>
        </div>
      </div>
    </div>
  );
}
