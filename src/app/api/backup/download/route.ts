import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return new NextResponse('Acceso no autorizado', { status: 403 });
    }

    const db = await dbManager.getDb();
    const now = new Date();
    const rawContent = JSON.stringify(db, null, 2);
    const hash = crypto.createHash('sha256').update(rawContent).digest('hex');

    const backupPayload = {
      metadata: {
        system: 'Executive Dark CRM 2.0',
        version: '2.0.0-fase6',
        exported_by: session.email,
        exported_at: now.toISOString(),
        organization_id: session.organization_id,
        sha256_checksum: hash,
        record_counts: {
          organizations: db.organizations?.length || 0,
          profiles: db.profiles?.length || 0,
          leads: db.leads?.length || 0,
          clients: db.clients?.length || 0,
          contacts: db.contacts?.length || 0,
          opportunities: db.opportunities?.length || 0,
          activities: db.activities?.length || 0,
          products: db.products?.length || 0,
          quotes: db.quotes?.length || 0,
          documents: db.documents?.length || 0,
          audit_logs: db.audit_logs?.length || 0,
        },
      },
      data: db,
    };

    const buffer = Buffer.from(JSON.stringify(backupPayload, null, 2), 'utf-8');
    const filename = `crm-backup-${now.toISOString().split('T')[0]}.json`;

    await dbManager.logAudit(
      session.organization_id,
      'DESCARGAR_RESPALDO_BASE_DATOS',
      'system',
      session.id,
      `Respaldo completo de base de datos descargado por ${session.email} (SHA-256: ${hash.slice(0, 10)}...)`,
      { id: session.id, email: session.email }
    );

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error al generar descarga de respaldo:', error);
    return new NextResponse('Error al exportar base de datos', { status: 500 });
  }
}
