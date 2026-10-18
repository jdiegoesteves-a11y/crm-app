'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { DocumentAttachment, DocumentEntityType } from '@/types/database';

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
const UPLOAD_DIR = IS_VERCEL
  ? '/tmp/crm_data/uploads'
  : path.join(process.cwd(), '.data', 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
];

export async function uploadDocumentAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const file = formData.get('file') as File | null;
    const entityType = (formData.get('entity_type') as DocumentEntityType) || 'general';
    const entityId = (formData.get('entity_id') as string) || undefined;

    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No se ha proporcionado un archivo válido.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'El archivo supera el tamaño máximo permitido de 5 MB.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|webp|xlsx?|docx?|txt)$/i)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Formatos aceptados: PDF, JPG, PNG, WEBP, XLSX, DOCX.',
      };
    }

    ensureUploadDir();

    const fileExt = path.extname(file.name) || '';
    const safeFileName = `${Date.now()}-${generateId()}${fileExt}`;
    const targetFilePath = path.join(UPLOAD_DIR, safeFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetFilePath, buffer);

    const db = dbManager.getDb();
    const docId = generateId();

    const newDoc: DocumentAttachment = {
      id: docId,
      organization_id: session.organization_id,
      uploaded_by: session.id,
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: safeFileName,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      created_at: new Date().toISOString(),
    };

    db.documents.unshift(newDoc);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'SUBIR_DOCUMENTO',
      'document',
      docId,
      `Archivo [${file.name}] (${(file.size / 1024).toFixed(1)} KB) adjuntado a ${entityType} por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/documentos');
    if (entityId) {
      if (entityType === 'client') revalidatePath(`/clientes/${entityId}`);
      if (entityType === 'quote') revalidatePath(`/cotizaciones/${entityId}`);
    }

    return {
      success: true,
      message: 'Documento subido y vinculado exitosamente.',
      document: newDoc,
    };
  } catch (error) {
    console.error('Error al subir documento:', error);
    return { success: false, error: 'Ocurrió un error al procesar el archivo.' };
  }
}

export async function deleteDocumentAction(documentId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (!['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden eliminar documentos.' };
    }

    const db = dbManager.getDb();
    const index = db.documents.findIndex(
      (d) => d.id === documentId && d.organization_id === session.organization_id
    );

    if (index === -1) {
      return { success: false, error: 'Documento no encontrado' };
    }

    const doc = db.documents[index];
    const physicalPath = path.join(UPLOAD_DIR, doc.file_path);

    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
    }

    db.documents.splice(index, 1);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_DOCUMENTO',
      'document',
      doc.id,
      `Archivo adjunto [${doc.file_name}] eliminado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/documentos');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return { success: false, error: 'Error al eliminar el archivo.' };
  }
}
