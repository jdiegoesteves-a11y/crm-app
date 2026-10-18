'use server';

import { revalidatePath } from 'next/cache';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Activity, Quote } from '@/types/database';

export async function runAutomationsAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (!['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden ejecutar el motor de automatizaciones.' };
    }

    const db = dbManager.getDb();
    const orgId = session.organization_id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let activitiesCreated = 0;
    let quotesExpired = 0;

    // Regla 1: Oportunidades abiertas próximas a vencer o inactivas -> Crear tarea de seguimiento preventiva
    const wonStages = db.pipeline_stages.filter((s) => s.organization_id === orgId && s.is_won).map((s) => s.id);
    const lostStages = db.pipeline_stages.filter((s) => s.organization_id === orgId && s.is_lost).map((s) => s.id);

    const openOpps = db.opportunities.filter(
      (o) => o.organization_id === orgId && !wonStages.includes(o.stage_id) && !lostStages.includes(o.stage_id)
    );

    for (const opp of openOpps) {
      // Verificar si ya tiene una actividad pendiente programada
      const hasPendingAct = db.activities.some(
        (a) => a.organization_id === orgId && a.opportunity_id === opp.id && a.status === 'pendiente'
      );

      if (!hasPendingAct) {
        const newAct: Activity = {
          id: generateId(),
          organization_id: orgId,
          assigned_to: opp.assigned_to,
          client_id: opp.client_id,
          opportunity_id: opp.id,
          type: 'llamada',
          title: `[Auto-Alerta] Seguimiento prioritario: ${opp.title}`,
          description: `Regla de automatización: Oportunidad de $${Number(opp.expected_value).toLocaleString()} USD sin actividad programada reciente.`,
          due_date: new Date(Date.now() + 24 * 3600000).toISOString(),
          status: 'pendiente',
          priority: 'alta',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.activities.unshift(newAct);
        activitiesCreated++;
      }
    }

    // Regla 2: Cotizaciones vencidas según fecha límite valid_until
    for (const quote of db.quotes) {
      if (
        quote.organization_id === orgId &&
        (quote.status === 'borrador' || quote.status === 'enviada') &&
        quote.valid_until < todayStr
      ) {
        quote.status = 'vencida';
        quote.updated_at = new Date().toISOString();
        quotesExpired++;
      }
    }

    dbManager.saveDb(db);

    dbManager.logAudit(
      orgId,
      'MOTOR_AUTOMATIZACION_EJECUTADO',
      'automation',
      session.id,
      `Motor de reglas ejecutado por ${session.email}: ${activitiesCreated} tareas creadas, ${quotesExpired} cotizaciones actualizadas a vencidas.`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/dashboard');
    revalidatePath('/reportes');
    revalidatePath('/actividades');
    revalidatePath('/cotizaciones');

    return {
      success: true,
      activitiesCreated,
      quotesExpired,
      message: `Automatizaciones completadas: ${activitiesCreated} tareas generadas, ${quotesExpired} cotizaciones marcadas como vencidas.`,
    };
  } catch (error) {
    console.error('Error al ejecutar automatizaciones:', error);
    return { success: false, error: 'Error al ejecutar motor de automatizaciones.' };
  }
}
