'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Quote,
  Client,
  SessionUser,
  QuoteStatus,
} from '@/types/database';
import {
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  Trash2,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { updateQuoteStatusAction, deleteQuoteAction } from '@/app/actions/quotes';

interface QuotesClientProps {
  quotes: Quote[];
  clients: Client[];
  currentUser: SessionUser;
}

export function QuotesClient({
  quotes: initialQuotes,
  clients,
  currentUser,
}: QuotesClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status mapping
  const statusConfig: Record<QuoteStatus, { label: string; bg: string; text: string; border: string }> = {
    borrador: { label: 'Borrador', bg: 'bg-[#A5B2C1]/15', text: 'text-[#A5B2C1]', border: 'border-[#A5B2C1]/30' },
    enviada: { label: 'Enviada', bg: 'bg-[#28B8AA]/15', text: 'text-[#28B8AA]', border: 'border-[#28B8AA]/30' },
    aceptada: { label: 'Aceptada', bg: 'bg-[#34C48A]/15', text: 'text-[#34C48A]', border: 'border-[#34C48A]/30' },
    rechazada: { label: 'Rechazada', bg: 'bg-[#F17474]/15', text: 'text-[#F17474]', border: 'border-[#F17474]/30' },
    vencida: { label: 'Vencida', bg: 'bg-[#F0B454]/15', text: 'text-[#F0B454]', border: 'border-[#F0B454]/30' },
  };

  // Métricas
  const totalCotizado = quotes.reduce((acc, q) => acc + (Number(q.grand_total) || 0), 0);
  const totalAceptadas = quotes
    .filter((q) => q.status === 'aceptada')
    .reduce((acc, q) => acc + (Number(q.grand_total) || 0), 0);
  const countAceptadas = quotes.filter((q) => q.status === 'aceptada').length;
  const countPendientes = quotes.filter((q) => q.status === 'enviada' || q.status === 'borrador').length;
  const tasaAprobacion = quotes.length > 0 ? Math.round((countAceptadas / quotes.length) * 100) : 0;

  // Filtrado
  const filteredQuotes = quotes.filter((q) => {
    const client = clients.find((c) => c.id === q.client_id);
    const clientName = client?.name?.toLowerCase() || '';
    const quoteNum = q.quote_number.toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = quoteNum.includes(term) || clientName.includes(term);
    const matchesStatus = statusFilter === 'todos' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    setLoadingId(quoteId);
    setFeedback(null);
    try {
      const res = await updateQuoteStatusAction(quoteId, newStatus);
      if (res.success) {
        setQuotes((prev) =>
          prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
        );
        setFeedback({ type: 'success', text: `Estado actualizado a "${statusConfig[newStatus].label}".` });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al cambiar estado' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (quoteId: string, quoteNumber: string) => {
    if (!confirm(`¿Está seguro de eliminar permanentemente la cotización ${quoteNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setLoadingId(quoteId);
    setFeedback(null);
    try {
      const res = await deleteQuoteAction(quoteId);
      if (res.success) {
        setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
        setFeedback({ type: 'success', text: `Cotización ${quoteNumber} eliminada correctamente.` });
      } else {
        setFeedback({ type: 'error', text: res.error || 'No se pudo eliminar la cotización.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al procesar la eliminación.' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Cotizaciones Comerciales</h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              Fase 4: Operaciones
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Generador de ofertas comerciales con cálculo automático de impuestos y exportación en PDF de alta fidelidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/catalogo"
            className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#A5B2C1]" />
            <span>Ver Catálogo</span>
          </Link>
          {currentUser.role !== 'consulta' && (
            <Link
              href="/cotizaciones/nueva"
              className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cotización</span>
            </Link>
          )}
        </div>
      </div>

      {/* Banner de Feedback */}
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
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas Métricas de Cotización */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#28B8AA]/15 border border-[#28B8AA]/30 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-[#28B8AA]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Total Cotizado</p>
            <p className="text-lg font-bold text-[#F4F7FA]">
              ${totalCotizado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-[#A5B2C1] font-normal">USD</span>
            </p>
          </div>
        </div>

        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34C48A]/15 border border-[#34C48A]/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#34C48A]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Aceptadas ({countAceptadas})</p>
            <p className="text-lg font-bold text-[#34C48A]">
              ${totalAceptadas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-[#A5B2C1] font-normal">USD</span>
            </p>
          </div>
        </div>

        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0B454]/15 border border-[#F0B454]/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#F0B454]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Pendientes de Cierre</p>
            <p className="text-lg font-bold text-[#F4F7FA]">
              {countPendientes} <span className="text-[10px] text-[#A5B2C1] font-normal">propuestas</span>
            </p>
          </div>
        </div>

        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#202C39] border border-[#30404E] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#28B8AA]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Tasa de Cierre</p>
            <p className="text-lg font-bold text-[#28B8AA]">
              {tasaAprobacion}% <span className="text-[10px] text-[#A5B2C1] font-normal">de efectividad</span>
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="crm-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="crm-input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-[#A5B2C1] font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {['todos', 'borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors capitalize shrink-0 ${
                statusFilter === st
                  ? 'bg-[#28B8AA] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA] border border-[#30404E]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-[#30404E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#28B8AA]" />
            <h2 className="text-sm font-bold text-[#F4F7FA]">
              Cotizaciones Registradas ({filteredQuotes.length})
            </h2>
          </div>
          <span className="text-[11px] text-[#A5B2C1]">
            Mostrando {filteredQuotes.length} de {quotes.length} en total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Emisión / Validez</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">IVA (15%)</th>
                <th className="py-3 px-4 text-right">Gran Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A5B2C1]">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-[#30404E] mb-2" />
                    <p className="font-medium">No se encontraron cotizaciones.</p>
                    <p className="text-[11px] mt-1 text-[#A5B2C1]/70">
                      {searchTerm || statusFilter !== 'todos'
                        ? 'Prueba modificando tus términos de búsqueda o filtros.'
                        : 'Comienza creando tu primera propuesta comercial formal.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const client = clients.find((c) => c.id === q.client_id);
                  const statusInfo = statusConfig[q.status] || statusConfig.borrador;
                  const isLoading = loadingId === q.id;

                  return (
                    <tr key={q.id} className="hover:bg-[#202C39]/40 transition-colors">
                      {/* Número */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/cotizaciones/${q.id}`}
                          className="font-mono font-bold text-[#28B8AA] hover:underline"
                        >
                          {q.quote_number}
                        </Link>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        {client ? (
                          <Link
                            href={`/clientes/${client.id}`}
                            className="font-semibold text-[#F4F7FA] hover:text-[#28B8AA] transition-colors block"
                          >
                            {client.name}
                          </Link>
                        ) : (
                          <span className="text-[#A5B2C1]">Cliente no asignado</span>
                        )}
                        <span className="text-[10px] text-[#A5B2C1]">
                          {client?.identification_type} {client?.identification_number}
                        </span>
                      </td>

                      {/* Fechas */}
                      <td className="py-3 px-4">
                        <div className="text-[#F4F7FA] font-medium">{q.issue_date}</div>
                        <div className="text-[10px] text-[#A5B2C1]">Vence: {q.valid_until}</div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right font-mono text-[#A5B2C1]">
                        ${Number(q.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* IVA */}
                      <td className="py-3 px-4 text-right font-mono text-[#A5B2C1]">
                        ${Number(q.tax_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#F4F7FA]">
                        ${Number(q.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </td>

                      {/* Estado con Selector Rápido */}
                      <td className="py-3 px-4 text-center">
                        {currentUser.role === 'consulta' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            {statusInfo.label}
                          </span>
                        ) : (
                          <select
                            value={q.status}
                            disabled={isLoading}
                            onChange={(e) => handleStatusChange(q.id, e.target.value as QuoteStatus)}
                            className={`text-[10px] font-bold rounded px-2 py-1 bg-[#151F2A] border border-[#30404E] cursor-pointer focus:outline-none focus:border-[#28B8AA] transition-colors ${statusInfo.text}`}
                          >
                            <option value="borrador">Borrador</option>
                            <option value="enviada">Enviada</option>
                            <option value="aceptada">Aceptada</option>
                            <option value="rechazada">Rechazada</option>
                            <option value="vencida">Vencida</option>
                          </select>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Detalle */}
                          <Link
                            href={`/cotizaciones/${q.id}`}
                            className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#28B8AA] transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Descargar PDF */}
                          <a
                            href={`/api/quotes/${q.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#34C48A] transition-colors"
                            title="Descargar PDF Corporativo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Imprimir Vista Web */}
                          <Link
                            href={`/cotizaciones/${q.id}/imprimir`}
                            target="_blank"
                            className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#F0B454] transition-colors"
                            title="Vista Imprimible"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          {/* Eliminar (Solo Admin / Gerente) */}
                          {['admin', 'gerente'].includes(currentUser.role) && (
                            <button
                              onClick={() => handleDelete(q.id, q.quote_number)}
                              disabled={isLoading}
                              className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#F17474] transition-colors"
                              title="Eliminar Cotización"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
