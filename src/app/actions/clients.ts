'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Client, ClientType } from '@/types/database';

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre o razón social es obligatorio'),
  type: z.enum(['empresa', 'persona']),
  identification_type: z.string().min(1, 'El tipo de identificación es obligatorio'),
  identification_number: z.string().min(3, 'El número de identificación es obligatorio'),
  industry: z.string().optional(),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const rawData = {
      name: formData.get('name') as string,
      type: (formData.get('type') as ClientType) || 'empresa',
      identification_type: (formData.get('identification_type') as string) || 'RUC',
      identification_number: formData.get('identification_number') as string,
      industry: (formData.get('industry') as string) || undefined,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      city: (formData.get('city') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      assigned_to: (formData.get('assigned_to') as string) || session.id,
      notes: (formData.get('notes') as string) || undefined,
    };

    const parsed = clientSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del cliente inválidos' };
    }

    const db = dbManager.getDb();

    // Validar duplicado de RUC / Identificación en la misma organización
    const exists = db.clients.some(
      (c) =>
        c.organization_id === session.organization_id &&
        c.identification_number.trim().toLowerCase() === parsed.data.identification_number.trim().toLowerCase()
    );

    if (exists) {
      return { success: false, error: 'Ya existe un cliente registrado con este número de identificación o RUC.' };
    }

    const now = new Date().toISOString();
    const newClient: Client = {
      id: generateId(),
      organization_id: session.organization_id,
      assigned_to: parsed.data.assigned_to || session.id,
      type: parsed.data.type,
      name: parsed.data.name,
      identification_type: parsed.data.identification_type,
      identification_number: parsed.data.identification_number,
      industry: parsed.data.industry,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      address: parsed.data.address,
      city: parsed.data.city,
      website: parsed.data.website,
      notes: parsed.data.notes,
      created_at: now,
      updated_at: now,
    };

    db.clients.unshift(newClient);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_CLIENTE',
      'client',
      newClient.id,
      `Cliente ${newClient.name} (${newClient.identification_number}) creado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/clientes');
    revalidatePath('/dashboard');
    return { success: true, message: 'Cliente registrado exitosamente', clientId: newClient.id };
  } catch (error) {
    console.error('Error en createClientAction:', error);
    return { success: false, error: 'Ocurrió un error inesperado al registrar el cliente.' };
  }
}

export async function updateClientAction(clientId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const client = db.clients.find((c) => c.id === clientId && c.organization_id === session.organization_id);
    if (!client) return { success: false, error: 'Cliente no encontrado' };

    if (formData.has('name')) client.name = formData.get('name') as string;
    if (formData.has('type')) client.type = formData.get('type') as ClientType;
    if (formData.has('identification_type')) client.identification_type = formData.get('identification_type') as string;
    if (formData.has('identification_number')) client.identification_number = formData.get('identification_number') as string;
    if (formData.has('industry')) client.industry = formData.get('industry') as string;
    if (formData.has('email')) client.email = (formData.get('email') as string).toLowerCase();
    if (formData.has('phone')) client.phone = formData.get('phone') as string;
    if (formData.has('address')) client.address = formData.get('address') as string;
    if (formData.has('city')) client.city = formData.get('city') as string;
    if (formData.has('website')) client.website = formData.get('website') as string;
    if (formData.has('assigned_to')) client.assigned_to = formData.get('assigned_to') as string;
    if (formData.has('notes')) client.notes = formData.get('notes') as string;

    client.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ACTUALIZAR_CLIENTE',
      'client',
      client.id,
      `Cliente ${client.name} actualizado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath(`/clientes/${clientId}`);
    revalidatePath('/clientes');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al actualizar cliente.' };
  }
}

export async function addClientNoteAction(clientId: string, noteText: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };

    const db = dbManager.getDb();
    const client = db.clients.find((c) => c.id === clientId && c.organization_id === session.organization_id);
    if (!client) return { success: false, error: 'Cliente no encontrado' };

    const timestamp = new Date().toLocaleString('es-EC');
    const newEntry = `[${timestamp} - ${session.full_name}]: ${noteText}`;
    client.notes = client.notes ? `${client.notes}\n\n${newEntry}` : newEntry;
    client.updated_at = new Date().toISOString();

    dbManager.saveDb(db);

    revalidatePath(`/clientes/${clientId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Error al agregar nota.' };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden eliminar clientes.' };
    }

    const db = dbManager.getDb();
    const index = db.clients.findIndex((c) => c.id === clientId && c.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Cliente no encontrado' };

    const deleted = db.clients.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_CLIENTE',
      'client',
      clientId,
      `Cliente ${deleted.name} eliminado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/clientes');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar cliente.' };
  }
}
