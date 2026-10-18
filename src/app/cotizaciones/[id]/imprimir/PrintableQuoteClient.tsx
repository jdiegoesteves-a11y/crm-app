'use client';

import React from 'react';
import Link from 'next/link';
import {
  Quote,
  Client,
  Organization,
  QuoteItem,
  Profile,
} from '@/types/database';
import { Printer, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

interface PrintableQuoteClientProps {
  quote: Quote;
  client: Client;
  org: Organization;
  items: QuoteItem[];
  creator?: Profile;
}

export function PrintableQuoteClient({
  quote,
  client,
  org,
  items,
  creator,
}: PrintableQuoteClientProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#1E293B] font-sans antialiased">
      {/* Barra de Acciones para Pantalla (Oculta en Impresión) */}
      <header className="print:hidden sticky top-0 z-50 bg-[#151F2A] border-b border-[#30404E] py-3 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/cotizaciones/${quote.id}`}
              className="p-2 rounded-lg bg-[#202C39] hover:bg-[#30404E] text-[#A5B2C1] hover:text-[#F4F7FA] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-bold text-[#F4F7FA]">
                Vista Previa Imprimible — {quote.quote_number}
              </span>
              <p className="text-[11px] text-[#A5B2C1]">
                Formato optimizado para impresión A4 o guardado como PDF en navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/quotes/${quote.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="crm-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </a>

            <button
              onClick={handlePrint}
              className="crm-button-primary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hoja A4 Imprimible */}
      <main className="max-w-4xl mx-auto my-6 print:my-0 p-8 sm:p-12 bg-white rounded-xl print:rounded-none shadow-2xl print:shadow-none border border-slate-200 print:border-none print:p-0">
        {/* Franja Superior Corporativa */}
        <div className="h-2 w-full bg-[#28B8AA] mb-8 rounded-t print:rounded-none" />

        {/* Encabezado Corporativo */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {org.name || 'Acme Industrial & Services S.A.'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              RUC: <strong className="text-slate-700">{org.tax_id || '1792345678001'}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Dirección Corporativa: Av. República de El Salvador N36-84 y Naciones Unidas, Quito
            </p>
            <p className="text-xs text-slate-500">
              Teléfono: +593 2 398 4400 • Correo: contacto@acmeindustrial.ec
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-right min-w-[200px]">
            <span className="text-[10px] font-bold tracking-widest text-[#28B8AA] uppercase block">
              COTIZACIÓN COMERCIAL
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
              {quote.quote_number}
            </span>
            <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
              <div>Fecha: <strong className="text-slate-700">{quote.issue_date}</strong></div>
              <div>Válido hasta: <strong className="text-slate-700">{quote.valid_until}</strong></div>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Asesor */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              PREPARADO PARA EL CLIENTE:
            </h2>
            <p className="text-sm font-bold text-slate-900">{client.name}</p>
            <p className="text-slate-600 mt-1">
              {client.identification_type}: <strong className="text-slate-800">{client.identification_number}</strong>
            </p>
            <p className="text-slate-600">{client.email} • {client.phone || 'N/A'}</p>
            {client.address && (
              <p className="text-slate-600">{client.city ? `${client.city}, ` : ''}{client.address}</p>
            )}
          </div>

          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              EJECUTIVO DE CUENTA ASIGNADO:
            </h2>
            <p className="text-sm font-bold text-slate-900">
              {creator?.full_name || 'Departamento Comercial'}
            </p>
            <p className="text-slate-600 mt-1">{creator?.email || 'ventas@acmeindustrial.ec'}</p>
            <p className="text-slate-600">Moneda de Pago: <strong>{quote.currency}</strong> (Dólares Americanos)</p>
          </div>
        </div>

        {/* Tabla de Bienes y Servicios */}
        <div className="py-6">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Descripción de Bienes o Servicios</th>
                <th className="py-2.5 px-2 text-center w-16">Cant.</th>
                <th className="py-2.5 px-3 text-right w-24">Precio Unit.</th>
                <th className="py-2.5 px-2 text-center w-16">Desc %</th>
                <th className="py-2.5 px-2 text-center w-16">IVA %</th>
                <th className="py-2.5 px-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{item.discount_percent}%</td>
                  <td className="py-2.5 px-2 text-center font-mono">{item.tax_rate}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ${Number(item.total_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloque de Totales */}
        <div className="flex justify-end pb-8">
          <div className="w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">${Number(quote.subtotal).toFixed(2)} USD</span>
            </div>
            {quote.discount_total > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento Comercial:</span>
                <span className="font-mono font-semibold">-${Number(quote.discount_total).toFixed(2)} USD</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>IVA (15%):</span>
              <span className="font-mono font-semibold">${Number(quote.tax_total).toFixed(2)} USD</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-base text-[#28B8AA]">
                ${Number(quote.grand_total).toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">TÉRMINOS Y CONDICIONES</h3>
            <p className="text-slate-600 whitespace-pre-line leading-relaxed">
              {quote.terms_conditions || 'Oferta válida por 30 días.'}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">NOTAS COMERCIALES</h3>
            <p className="text-slate-600 whitespace-pre-line leading-relaxed">
              {quote.notes || 'Forma de pago acordada entre las partes.'}
            </p>
          </div>
        </div>

        {/* Firmas de Aceptación */}
        <div className="grid grid-cols-2 gap-16 pt-20 text-xs text-center">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              {org.name}
            </div>
            <p className="text-slate-500 text-[11px]">Firma Autorizada / Representante Legal</p>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              {client.name}
            </div>
            <p className="text-slate-500 text-[11px]">Aceptación de la Oferta / Firma y Sello del Cliente</p>
          </div>
        </div>

        {/* Pie de Página */}
        <footer className="pt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 mt-12">
          Documento comercial generado electrónicamente por Executive Dark CRM 2.0 • ID: {quote.id}
        </footer>
      </main>
    </div>
  );
}
