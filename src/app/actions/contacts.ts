'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Contact } from '@/types/database';

const contactSchema = z.object({
  client_id: z.string().min(1, 'El cliente asociado es obligatorio'),
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  job_title: z.string().optional(),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  preferred_channel: z.string().optional(),
  is_primary: z.boolean().optional(),
});

export async function createContactAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const rawData = {
      client_id: formData.get('client_id') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      job_title: (formData.get('job_title') as string) || undefined,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      preferred_channel: (formData.get('preferred_channel') as string) || 'email',
      is_primary: formData.get('is_primary') === 'true',
    };

    const parsed = contactSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del contacto inválidos' };
    }

    const db = dbManager.getDb();
    const now = new Date().toISOString();

    const newContact: Contact = {
      id: generateId(),
      organization_id: session.organization_id,
      client_id: parsed.data.client_id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      job_title: parsed.data.job_title,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      preferred_channel: parsed.data.preferred_channel,
      is_primary: parsed.data.is_primary || false,
      created_at: now,
      updated_at: now,
    };

    db.contacts.unshift(newContact);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_CONTACTO',
      'contact',
      newContact.id,
      `Contacto ${newContact.first_name} ${newContact.last_name} agregado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/contactos');
    revalidatePath(`/clientes/${parsed.data.client_id}`);
    return { success: true, message: 'Contacto registrado exitosamente' };
  } catch (error) {
    console.error('Error en createContactAction:', error);
    return { success: false, error: 'Error inesperado al crear contacto.' };
  }
}

export async function deleteContactAction(contactId: string) {
  try {
    const session = await getSession();
    if (!session || session.role === 'consulta') {
      return { success: false, error: 'No autorizado' };
    }

    const db = dbManager.getDb();
    const index = db.contacts.findIndex((c) => c.id === contactId && c.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Contacto no encontrado' };

    const deleted = db.contacts.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_CONTACTO',
      'contact',
      contactId,
      `Contacto ${deleted.first_name} ${deleted.last_name} eliminado`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/contactos');
    revalidatePath(`/clientes/${deleted.client_id}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar contacto.' };
  }
}
