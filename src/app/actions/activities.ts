'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Activity, ActivityStatus, ActivityType, PriorityLevel } from '@/types/database';

const activitySchema = z.object({
  title: z.string().min(2, 'El título o asunto es obligatorio'),
  type: z.enum(['llamada', 'reunion', 'tarea', 'visita', 'email', 'nota']),
  description: z.string().optional(),
  due_date: z.string().min(1, 'La fecha y hora de vencimiento es obligatoria'),
  priority: z.enum(['baja', 'media', 'alta']),
  status: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']),
  client_id: z.string().optional(),
  opportunity_id: z.string().optional(),
  lead_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

export async function createActivityAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const rawData = {
      title: formData.get('title') as string,
      type: (formData.get('type') as ActivityType) || 'tarea',
      description: (formData.get('description') as string) || undefined,
      due_date: formData.get('due_date') as string,
      priority: (formData.get('priority') as PriorityLevel) || 'media',
      status: (formData.get('status') as ActivityStatus) || 'pendiente',
      client_id: (formData.get('client_id') as string) || undefined,
      opportunity_id: (formData.get('opportunity_id') as string) || undefined,
      lead_id: (formData.get('lead_id') as string) || undefined,
      assigned_to: (formData.get('assigned_to') as string) || session.id,
    };

    const parsed = activitySchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de la actividad inválidos' };
    }

    const db = dbManager.getDb();
    const now = new Date().toISOString();

    const newActivity: Activity = {
      id: generateId(),
      organization_id: session.organization_id,
      assigned_to: parsed.data.assigned_to || session.id,
      client_id: parsed.data.client_id,
      opportunity_id: parsed.data.opportunity_id,
      lead_id: parsed.data.lead_id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      due_date: parsed.data.due_date,
      status: parsed.data.status,
      priority: parsed.data.priority,
      created_at: now,
      updated_at: now,
    };

    db.activities.unshift(newActivity);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_ACTIVIDAD',
      'activity',
      newActivity.id,
      `Actividad [${newActivity.type.toUpperCase()}] "${newActivity.title}" programada para ${new Date(newActivity.due_date).toLocaleString('es-EC')} por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/actividades');
    revalidatePath('/calendario');
    revalidatePath('/dashboard');
    if (parsed.data.client_id) revalidatePath(`/clientes/${parsed.data.client_id}`);

    return { success: true, message: 'Actividad registrada exitosamente', activityId: newActivity.id };
  } catch (error) {
    console.error('Error en createActivityAction:', error);
    return { success: false, error: 'Ocurrió un error al registrar la actividad.' };
  }
}

export async function updateActivityStatusAction(activityId: string, newStatus: ActivityStatus) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const activity = db.activities.find((a) => a.id === activityId && a.organization_id === session.organization_id);
    if (!activity) return { success: false, error: 'Actividad no encontrada' };

    activity.status = newStatus;
    activity.updated_at = new Date().toISOString();

    if (newStatus === 'completada') {
      activity.completed_at = new Date().toISOString();
    } else {
      activity.completed_at = undefined;
    }

    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      newStatus === 'completada' ? 'COMPLETAR_ACTIVIDAD' : 'ACTUALIZAR_ESTADO_ACTIVIDAD',
      'activity',
      activity.id,
      `Actividad "${activity.title}" marcada como [${newStatus.toUpperCase()}] por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/actividades');
    revalidatePath('/calendario');
    revalidatePath('/dashboard');
    if (activity.client_id) revalidatePath(`/clientes/${activity.client_id}`);

    return { success: true, newStatus: activity.status };
  } catch {
    return { success: false, error: 'Error al cambiar estado de la actividad.' };
  }
}

export async function deleteActivityAction(activityId: string) {
  try {
    const session = await getSession();
    if (!session || session.role === 'consulta') {
      return { success: false, error: 'No autorizado' };
    }

    const db = dbManager.getDb();
    const index = db.activities.findIndex((a) => a.id === activityId && a.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Actividad no encontrada' };

    const deleted = db.activities.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_ACTIVIDAD',
      'activity',
      activityId,
      `Actividad "${deleted.title}" eliminada por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/actividades');
    revalidatePath('/calendario');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar actividad.' };
  }
}
