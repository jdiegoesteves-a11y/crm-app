import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbManager } from '@/lib/db';

export const dynamic = 'force-dynamic';

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
const UPLOAD_DIR = IS_VERCEL
  ? '/tmp/crm_data/uploads'
  : path.join(process.cwd(), '.data', 'uploads');

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
    const db = dbManager.getDb();

    const doc = db.documents.find(
      (d) => d.id === id && d.organization_id === session.organization_id
    );

    if (!doc) {
      return new NextResponse('Documento no encontrado', { status: 404 });
    }

    const filePath = path.join(UPLOAD_DIR, doc.file_path);
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Archivo no encontrado en el servidor', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
        'Content-Length': String(doc.file_size),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error al descargar documento:', error);
    return new NextResponse('Error interno al descargar documento', { status: 500 });
  }
}
