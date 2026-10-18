import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';
import { generateQuotePdfBuffer } from '@/lib/pdf/generateQuotePdf';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { id } = await params;
    const db = await dbManager.getDb();

    const quote = db.quotes.find(
      (q) => q.id === id && q.organization_id === session.organization_id
    );

    if (!quote) {
      return new NextResponse('Cotización no encontrada', { status: 404 });
    }

    const client = db.clients.find((c) => c.id === quote.client_id);
    if (!client) {
      return new NextResponse('Cliente no encontrado', { status: 404 });
    }

    const org = db.organizations.find((o) => o.id === session.organization_id) || {
      id: session.organization_id,
      name: session.organization_name || 'Acme Industrial & Services S.A.',
      tax_id: '1792345678001',
      currency: 'USD',
      timezone: 'America/Guayaquil',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const items = db.quote_items.filter((item) => item.quote_id === quote.id);
    const createdByUser = db.profiles.find((p) => p.id === quote.created_by);

    const pdfUint8 = generateQuotePdfBuffer(quote, client, org, items, createdByUser);
    const pdfBuffer = Buffer.from(pdfUint8);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${quote.quote_number}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generando PDF de cotización:', error);
    return new NextResponse('Error interno al generar PDF', { status: 500 });
  }
}
