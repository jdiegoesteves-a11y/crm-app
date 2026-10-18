'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Quote, QuoteItem, QuoteStatus } from '@/types/database';

export interface CreateQuoteItemInput {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
}

export interface CreateQuoteInput {
  client_id: string;
  opportunity_id?: string;
  issue_date: string;
  valid_until: string;
  notes?: string;
  terms_conditions?: string;
  items: CreateQuoteItemInput[];
}

export async function createQuoteAction(input: CreateQuoteInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    if (!input.client_id) return { success: false, error: 'Debe seleccionar un cliente' };
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Debe incluir al menos un ítem en la cotización' };
    }

    const db = dbManager.getDb();
    const orgQuotes = db.quotes.filter((q) => q.organization_id === session.organization_id);

    // Consecutivo correlativo dinámico: COT-2026-000X
    const year = new Date().getFullYear();
    const nextSeq = orgQuotes.length + 1;
    const quoteNumber = `COT-${year}-${String(nextSeq).padStart(4, '0')}`;

    const quoteId = generateId();
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const savedItems: QuoteItem[] = [];

    for (const item of input.items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const discPercent = Number(item.discount_percent) || 0;
      const taxRate = Number(item.tax_rate) !== undefined ? Number(item.tax_rate) : 15.00;

      const baseAmount = qty * price;
      const lineDiscount = baseAmount * (discPercent / 100);
      const lineSubtotal = baseAmount - lineDiscount;
      const lineTax = lineSubtotal * (taxRate / 100);

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      const quoteItem: QuoteItem = {
        id: generateId(),
        quote_id: quoteId,
        product_id: item.product_id || undefined,
        description: item.description,
        quantity: qty,
        unit_price: price,
        discount_percent: discPercent,
        tax_rate: taxRate,
        total_price: Number(lineSubtotal.toFixed(2)),
      };
      savedItems.push(quoteItem);
    }

    const grandTotal = Number((subtotal + taxTotal).toFixed(2));
    const now = new Date().toISOString();

    const newQuote: Quote = {
      id: quoteId,
      organization_id: session.organization_id,
      quote_number: quoteNumber,
      client_id: input.client_id,
      opportunity_id: input.opportunity_id || undefined,
      created_by: session.id,
      issue_date: input.issue_date || new Date().toISOString().split('T')[0],
      valid_until: input.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'borrador',
      subtotal: Number(subtotal.toFixed(2)),
      discount_total: Number(discountTotal.toFixed(2)),
      tax_total: Number(taxTotal.toFixed(2)),
      grand_total: grandTotal,
      currency: 'USD',
      notes: input.notes || 'Forma de pago: 50% anticipo y 50% contra entrega.',
      terms_conditions: input.terms_conditions || 'Precios válidos por 30 días. Incluye soporte técnico e impuestos de ley.',
      items: savedItems,
      created_at: now,
      updated_at: now,
    };

    db.quotes.unshift(newQuote);
    db.quote_items.push(...savedItems);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_COTIZACION',
      'quote',
      newQuote.id,
      `Cotización [${newQuote.quote_number}] por $${newQuote.grand_total} USD creada por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/cotizaciones');
    revalidatePath(`/clientes/${input.client_id}`);
    revalidatePath('/dashboard');

    return { success: true, message: `Cotización ${quoteNumber} generada exitosamente`, quoteId: newQuote.id };
  } catch (error) {
    console.error('Error al crear cotización:', error);
    return { success: false, error: 'Ocurrió un error al generar la cotización.' };
  }
}

export async function updateQuoteStatusAction(quoteId: string, newStatus: QuoteStatus) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const quote = db.quotes.find((q) => q.id === quoteId && q.organization_id === session.organization_id);
    if (!quote) return { success: false, error: 'Cotización no encontrada' };

    quote.status = newStatus;
    quote.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ACTUALIZAR_ESTADO_COTIZACION',
      'quote',
      quote.id,
      `Cotización [${quote.quote_number}] cambió a estado [${newStatus.toUpperCase()}] por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${quoteId}`);
    return { success: true, newStatus: quote.status };
  } catch {
    return { success: false, error: 'Error al cambiar estado de la cotización.' };
  }
}

export async function deleteQuoteAction(quoteId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden eliminar cotizaciones.' };
    }

    const db = dbManager.getDb();
    const index = db.quotes.findIndex((q) => q.id === quoteId && q.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Cotización no encontrada' };

    const deleted = db.quotes.splice(index, 1)[0];
    db.quote_items = db.quote_items.filter((item) => item.quote_id !== quoteId);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_COTIZACION',
      'quote',
      quoteId,
      `Cotización [${deleted.quote_number}] eliminada por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/cotizaciones');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar cotización.' };
  }
}
