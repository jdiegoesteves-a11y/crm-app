'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Opportunity } from '@/types/database';

const opportunitySchema = z.object({
  title: z.string().min(2, 'El título de la oportunidad es obligatorio'),
  client_id: z.string().min(1, 'El cliente es obligatorio'),
  contact_id: z.string().optional(),
  stage_id: z.string().min(1, 'La etapa es obligatoria'),
  assigned_to: z.string().optional(),
  expected_value: z.coerce.number().min(0, 'El valor estimado debe ser mayor o igual a 0'),
  probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.string().min(1, 'La fecha estimada de cierre es obligatoria'),
  notes: z.string().optional(),
});

export async function createOpportunityAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const rawData = {
      title: formData.get('title') as string,
      client_id: formData.get('client_id') as string,
      contact_id: (formData.get('contact_id') as string) || undefined,
      stage_id: formData.get('stage_id') as string,
      assigned_to: (formData.get('assigned_to') as string) || session.id,
      expected_value: formData.get('expected_value') || 0,
      probability: formData.get('probability') || undefined,
      expected_close_date: formData.get('expected_close_date') as string,
      notes: (formData.get('notes') as string) || undefined,
    };

    const parsed = opportunitySchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de la oportunidad inválidos' };
    }

    const db = dbManager.getDb();
    const stage = db.pipeline_stages.find((s) => s.id === parsed.data.stage_id);
    const prob = parsed.data.probability !== undefined ? parsed.data.probability : (stage?.probability ?? 50);

    const now = new Date().toISOString();
    const newOpportunity: Opportunity = {
      id: generateId(),
      organization_id: session.organization_id,
      client_id: parsed.data.client_id,
      contact_id: parsed.data.contact_id,
      stage_id: parsed.data.stage_id,
      assigned_to: parsed.data.assigned_to || session.id,
      title: parsed.data.title,
      expected_value: parsed.data.expected_value,
      currency: 'USD',
      probability: prob,
      expected_close_date: parsed.data.expected_close_date,
      notes: parsed.data.notes,
      created_at: now,
      updated_at: now,
    };

    db.opportunities.unshift(newOpportunity);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_OPORTUNIDAD',
      'opportunity',
      newOpportunity.id,
      `Oportunidad ${newOpportunity.title} ($${newOpportunity.expected_value} USD) creada por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/embudo');
    revalidatePath('/dashboard');
    revalidatePath(`/clientes/${parsed.data.client_id}`);
    return { success: true, message: 'Oportunidad creada exitosamente' };
  } catch (error) {
    console.error('Error en createOpportunityAction:', error);
    return { success: false, error: 'Ocurrió un error al registrar la oportunidad.' };
  }
}

export async function updateOpportunityStageAction(opportunityId: string, newStageId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const opp = db.opportunities.find((o) => o.id === opportunityId && o.organization_id === session.organization_id);
    if (!opp) return { success: false, error: 'Oportunidad no encontrada' };

    const newStage = db.pipeline_stages.find((s) => s.id === newStageId && s.organization_id === session.organization_id);
    if (!newStage) return { success: false, error: 'Etapa destino no válida' };

    const oldStage = db.pipeline_stages.find((s) => s.id === opp.stage_id);

    // Actualizar etapa y probabilidad según configuración
    opp.stage_id = newStageId;
    opp.probability = newStage.probability;
    opp.updated_at = new Date().toISOString();

    if (newStage.is_won) {
      opp.closed_at = new Date().toISOString();
    } else if (newStage.is_lost) {
      opp.closed_at = new Date().toISOString();
    } else {
      opp.closed_at = undefined;
    }

    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CAMBIO_ETAPA_OPORTUNIDAD',
      'opportunity',
      opp.id,
      `Oportunidad [${opp.title}] movida de [${oldStage?.name || 'Etapa previa'}] a [${newStage.name}] por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/embudo');
    revalidatePath('/dashboard');
    return { success: true, newStageName: newStage.name, newProbability: newStage.probability };
  } catch {
    return { success: false, error: 'Error al mover la oportunidad.' };
  }
}

export async function deleteOpportunityAction(opportunityId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden eliminar oportunidades.' };
    }

    const db = dbManager.getDb();
    const index = db.opportunities.findIndex((o) => o.id === opportunityId && o.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Oportunidad no encontrada' };

    const deleted = db.opportunities.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_OPORTUNIDAD',
      'opportunity',
      opportunityId,
      `Oportunidad ${deleted.title} eliminada por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/embudo');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar la oportunidad.' };
  }
}
