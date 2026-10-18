'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Lead, LeadStatus, PriorityLevel, Client, Contact, Opportunity } from '@/types/database';

const leadSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  company_name: z.string().optional(),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  source: z.string().min(1, 'La fuente es obligatoria'),
  interest: z.string().min(1, 'El interés comercial es obligatorio'),
  status: z.enum(['nuevo', 'contactado', 'calificado', 'descartado', 'convertido']),
  priority: z.enum(['baja', 'media', 'alta']),
  estimated_value: z.coerce.number().min(0, 'El valor estimado debe ser mayor o igual a 0'),
  assigned_to: z.string().optional(),
  next_followup_at: z.string().optional(),
  notes: z.string().optional(),
});

export async function createLeadAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const rawData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company_name: (formData.get('company_name') as string) || undefined,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      source: (formData.get('source') as string) || 'web',
      interest: formData.get('interest') as string,
      status: (formData.get('status') as LeadStatus) || 'nuevo',
      priority: (formData.get('priority') as PriorityLevel) || 'media',
      estimated_value: formData.get('estimated_value') || 0,
      assigned_to: (formData.get('assigned_to') as string) || session.id,
      next_followup_at: (formData.get('next_followup_at') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    const parsed = leadSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del prospecto inválidos' };
    }

    const db = dbManager.getDb();
    const now = new Date().toISOString();

    const newLead: Lead = {
      id: generateId(),
      organization_id: session.organization_id,
      assigned_to: parsed.data.assigned_to || session.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      company_name: parsed.data.company_name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      source: parsed.data.source,
      interest: parsed.data.interest,
      status: parsed.data.status,
      priority: parsed.data.priority,
      estimated_value: parsed.data.estimated_value,
      next_followup_at: parsed.data.next_followup_at,
      last_contact_at: now,
      notes: parsed.data.notes,
      created_at: now,
      updated_at: now,
    };

    db.leads.unshift(newLead);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_PROSPECTO',
      'lead',
      newLead.id,
      `Prospecto ${newLead.first_name} ${newLead.last_name} (${newLead.company_name || 'Particular'}) creado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/prospectos');
    revalidatePath('/dashboard');
    return { success: true, message: 'Prospecto creado exitosamente', leadId: newLead.id };
  } catch (error) {
    console.error('Error en createLeadAction:', error);
    return { success: false, error: 'Ocurrió un error inesperado al guardar el prospecto.' };
  }
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const lead = db.leads.find((l) => l.id === leadId && l.organization_id === session.organization_id);
    if (!lead) return { success: false, error: 'Prospecto no encontrado' };

    if (formData.has('first_name')) lead.first_name = formData.get('first_name') as string;
    if (formData.has('last_name')) lead.last_name = formData.get('last_name') as string;
    if (formData.has('company_name')) lead.company_name = formData.get('company_name') as string;
    if (formData.has('email')) lead.email = (formData.get('email') as string).toLowerCase();
    if (formData.has('phone')) lead.phone = formData.get('phone') as string;
    if (formData.has('status')) lead.status = formData.get('status') as LeadStatus;
    if (formData.has('priority')) lead.priority = formData.get('priority') as PriorityLevel;
    if (formData.has('source')) lead.source = formData.get('source') as string;
    if (formData.has('interest')) lead.interest = formData.get('interest') as string;
    if (formData.has('estimated_value')) lead.estimated_value = Number(formData.get('estimated_value'));
    if (formData.has('assigned_to')) lead.assigned_to = formData.get('assigned_to') as string;
    if (formData.has('next_followup_at')) lead.next_followup_at = formData.get('next_followup_at') as string;
    if (formData.has('notes')) lead.notes = formData.get('notes') as string;

    lead.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ACTUALIZAR_PROSPECTO',
      'lead',
      lead.id,
      `Prospecto ${lead.first_name} ${lead.last_name} actualizado`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/prospectos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al actualizar prospecto.' };
  }
}

export async function deleteLeadAction(leadId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden eliminar prospectos.' };
    }

    const db = dbManager.getDb();
    const index = db.leads.findIndex((l) => l.id === leadId && l.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Prospecto no encontrado' };

    const deleted = db.leads.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_PROSPECTO',
      'lead',
      leadId,
      `Prospecto ${deleted.first_name} ${deleted.last_name} eliminado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/prospectos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar prospecto.' };
  }
}

// CONVERTIR PROSPECTO EN CLIENTE + CONTACTO + OPORTUNIDAD EN 1 CLIC
export async function convertLeadAction(leadId: string, options: {
  identification_type: string;
  identification_number: string;
  opportunity_title?: string;
  stage_id?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const lead = db.leads.find((l) => l.id === leadId && l.organization_id === session.organization_id);
    if (!lead) return { success: false, error: 'Prospecto no encontrado' };

    if (lead.status === 'convertido') {
      return { success: false, error: 'Este prospecto ya ha sido convertido previamente.' };
    }

    const now = new Date().toISOString();
    const isCompany = !!lead.company_name && lead.company_name.trim().length > 0;
    const clientName = isCompany ? lead.company_name! : `${lead.first_name} ${lead.last_name}`;

    // 1. Crear Cliente
    const clientId = generateId();
    const newClient: Client = {
      id: clientId,
      organization_id: session.organization_id,
      assigned_to: lead.assigned_to || session.id,
      type: isCompany ? 'empresa' : 'persona',
      name: clientName,
      identification_type: options.identification_type || 'RUC',
      identification_number: options.identification_number || `CONV-${Date.now().toString().slice(-8)}`,
      industry: 'General',
      email: lead.email,
      phone: lead.phone,
      address: '',
      city: 'Ecuador',
      website: '',
      notes: `Convertido automáticamente desde prospecto el ${new Date().toLocaleDateString('es-EC')}. Notas iniciales: ${lead.notes || 'Ninguna'}`,
      created_at: now,
      updated_at: now,
    };
    db.clients.unshift(newClient);

    // 2. Si es empresa, crear el contacto asociado
    let contactId: string | undefined = undefined;
    if (isCompany) {
      contactId = generateId();
      const newContact: Contact = {
        id: contactId,
        organization_id: session.organization_id,
        client_id: clientId,
        first_name: lead.first_name,
        last_name: lead.last_name,
        job_title: 'Contacto Principal',
        email: lead.email,
        phone: lead.phone,
        is_primary: true,
        preferred_channel: 'email',
        created_at: now,
        updated_at: now,
      };
      db.contacts.unshift(newContact);
    }

    // 3. Crear Oportunidad en el Embudo
    const firstStage = db.pipeline_stages
      .filter((s) => s.organization_id === session.organization_id)
      .sort((a, b) => a.order_index - b.order_index)[0];

    const targetStageId = options.stage_id || (firstStage ? firstStage.id : 'stage-01');
    const stageObj = db.pipeline_stages.find((s) => s.id === targetStageId);

    const opportunityId = generateId();
    const newOpportunity: Opportunity = {
      id: opportunityId,
      organization_id: session.organization_id,
      client_id: clientId,
      contact_id: contactId,
      stage_id: targetStageId,
      assigned_to: lead.assigned_to || session.id,
      title: options.opportunity_title || `Oportunidad: ${lead.interest || clientName}`,
      expected_value: lead.estimated_value || 0,
      currency: 'USD',
      probability: stageObj ? stageObj.probability : 10,
      expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: `Generada por conversión de prospecto. Interés: ${lead.interest}`,
      created_at: now,
      updated_at: now,
    };
    db.opportunities.unshift(newOpportunity);

    // 4. Actualizar estado del prospecto a 'convertido'
    lead.status = 'convertido';
    lead.converted_client_id = clientId;
    lead.updated_at = now;

    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CONVERTIR_PROSPECTO',
      'lead',
      lead.id,
      `Prospecto ${lead.first_name} ${lead.last_name} convertido en Cliente [${clientName}] y Oportunidad [${newOpportunity.title}] por $${newOpportunity.expected_value} USD`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/prospectos');
    revalidatePath('/clientes');
    revalidatePath('/embudo');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Prospecto convertido exitosamente en Cliente y Oportunidad comercial.`,
      clientId,
      opportunityId,
    };
  } catch (error) {
    console.error('Error al convertir prospecto:', error);
    return { success: false, error: 'Ocurrió un error al convertir el prospecto.' };
  }
}

// IMPORTADOR CSV CON DEDUPLICACIÓN
export interface CsvLeadRow {
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  source?: string;
  interest?: string;
  estimated_value?: number;
  priority?: PriorityLevel;
}

export async function importLeadsCsvAction(leadsToImport: CsvLeadRow[]) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = dbManager.getDb();
    const existingEmails = new Set(
      db.leads
        .filter((l) => l.organization_id === session.organization_id)
        .map((l) => l.email.toLowerCase())
    );

    const now = new Date().toISOString();
    let importedCount = 0;
    let duplicateCount = 0;

    for (const row of leadsToImport) {
      if (!row.email || !row.first_name) continue;

      const normalizedEmail = row.email.toLowerCase().trim();

      // Detección de duplicados
      if (existingEmails.has(normalizedEmail)) {
        duplicateCount++;
        continue;
      }

      existingEmails.add(normalizedEmail);

      const newLead: Lead = {
        id: generateId(),
        organization_id: session.organization_id,
        assigned_to: session.id,
        first_name: row.first_name.trim(),
        last_name: (row.last_name || '').trim(),
        company_name: row.company_name?.trim() || undefined,
        email: normalizedEmail,
        phone: row.phone?.trim() || undefined,
        source: row.source?.trim() || 'import_csv',
        interest: row.interest?.trim() || 'Interés general',
        status: 'nuevo',
        priority: row.priority || 'media',
        estimated_value: Number(row.estimated_value) || 0,
        last_contact_at: now,
        created_at: now,
        updated_at: now,
      };

      db.leads.unshift(newLead);
      importedCount++;
    }

    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'IMPORTAR_PROSPECTOS_CSV',
      'lead',
      session.id,
      `Importación CSV: ${importedCount} importados, ${duplicateCount} duplicados omitidos por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/prospectos');
    revalidatePath('/dashboard');

    return {
      success: true,
      importedCount,
      duplicateCount,
      message: `Se importaron ${importedCount} prospectos correctamente (${duplicateCount} duplicados omitidos).`,
    };
  } catch (error) {
    console.error('Error al importar CSV:', error);
    return { success: false, error: 'Error al procesar la importación del archivo CSV.' };
  }
}
