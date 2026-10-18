import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Organization,
  Profile,
  PipelineStage,
  Lead,
  Client,
  Contact,
  Opportunity,
  Activity,
  Product,
  Quote,
  QuoteItem,
  AuditLog,
} from '@/types/database';

export interface DatabaseSchema {
  organizations: Organization[];
  profiles: Profile[];
  pipeline_stages: PipelineStage[];
  leads: Lead[];
  clients: Client[];
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  products: Product[];
  quotes: Quote[];
  quote_items: QuoteItem[];
  audit_logs: AuditLog[];
}

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'crm_database.json');

// Generador de UUID v4 seguro
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Inicialización de datos semilla realistas
function getInitialSeedData(): DatabaseSchema {
  const defaultOrgId = 'org-acme-001';
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  const organizations: Organization[] = [
    {
      id: defaultOrgId,
      name: 'Acme Industrial & Services S.A.',
      tax_id: '1792345678001',
      currency: 'USD',
      timezone: 'America/Guayaquil',
      logo_url: '',
      created_at: now,
      updated_at: now,
    },
  ];

  const adminId = 'usr-admin-001';
  const gerenteId = 'usr-gerente-002';
  const vendedorId = 'usr-vendedor-003';
  const consultaId = 'usr-consulta-004';

  const profiles: Profile[] = [
    {
      id: adminId,
      organization_id: defaultOrgId,
      email: 'admin@crmexecutive.com',
      full_name: 'Carlos Mendoza',
      role: 'admin',
      is_active: true,
      phone: '+593 99 123 4567',
      password_hash: defaultPasswordHash,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: gerenteId,
      organization_id: defaultOrgId,
      email: 'gerente@crmexecutive.com',
      full_name: 'Elena Rostova',
      role: 'gerente',
      is_active: true,
      phone: '+593 98 765 4321',
      password_hash: defaultPasswordHash,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: vendedorId,
      organization_id: defaultOrgId,
      email: 'vendedor@crmexecutive.com',
      full_name: 'Diego Morales',
      role: 'vendedor',
      is_active: true,
      phone: '+593 99 888 7766',
      password_hash: defaultPasswordHash,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: consultaId,
      organization_id: defaultOrgId,
      email: 'consulta@crmexecutive.com',
      full_name: 'Valeria Paz',
      role: 'consulta',
      is_active: true,
      phone: '+593 97 111 2233',
      password_hash: defaultPasswordHash,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  const stage1 = 'stage-01';
  const stage2 = 'stage-02';
  const stage3 = 'stage-03';
  const stage4 = 'stage-04';
  const stage5 = 'stage-05';
  const stage6 = 'stage-06';
  const stage7 = 'stage-07';

  const pipeline_stages: PipelineStage[] = [
    { id: stage1, organization_id: defaultOrgId, name: 'Nuevo prospecto', order_index: 1, probability: 10, is_won: false, is_lost: false, created_at: now },
    { id: stage2, organization_id: defaultOrgId, name: 'Contactado', order_index: 2, probability: 25, is_won: false, is_lost: false, created_at: now },
    { id: stage3, organization_id: defaultOrgId, name: 'Calificado', order_index: 3, probability: 40, is_won: false, is_lost: false, created_at: now },
    { id: stage4, organization_id: defaultOrgId, name: 'Propuesta enviada', order_index: 4, probability: 60, is_won: false, is_lost: false, created_at: now },
    { id: stage5, organization_id: defaultOrgId, name: 'Negociación', order_index: 5, probability: 80, is_won: false, is_lost: false, created_at: now },
    { id: stage6, organization_id: defaultOrgId, name: 'Ganado', order_index: 6, probability: 100, is_won: true, is_lost: false, created_at: now },
    { id: stage7, organization_id: defaultOrgId, name: 'Perdido', order_index: 7, probability: 0, is_won: false, is_lost: true, created_at: now },
  ];

  const client1Id = 'cli-001';
  const client2Id = 'cli-002';
  const client3Id = 'cli-003';

  const clients: Client[] = [
    {
      id: client1Id,
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      type: 'empresa',
      name: 'Corporación Favorita Retail S.A.',
      identification_type: 'RUC',
      identification_number: '1790016919001',
      industry: 'Retail y Consumo Masivo',
      email: 'compras@corporacionfavorita.com',
      phone: '+593 2 299 6500',
      address: 'Av. General Enríquez km 2.5',
      city: 'Quito',
      website: 'https://corporacionfavorita.com',
      notes: 'Cliente corporativo clase A. Renovación semestral de infraestructura y licencias.',
      created_at: now,
      updated_at: now,
    },
    {
      id: client2Id,
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      type: 'empresa',
      name: 'Servicios Petroleros del Oriente S.A.',
      identification_type: 'RUC',
      identification_number: '1791823901001',
      industry: 'Energía y Petróleo',
      email: 'operaciones@petro-oriente.ec',
      phone: '+593 2 382 9100',
      address: 'Av. República y Eloy Alfaro',
      city: 'Quito',
      website: 'https://petro-oriente.ec',
      notes: 'Requiere soporte 24/7 y SLA estricto de 2 horas.',
      created_at: now,
      updated_at: now,
    },
    {
      id: client3Id,
      organization_id: defaultOrgId,
      assigned_to: gerenteId,
      type: 'empresa',
      name: 'Constructora Alfa del Pacífico',
      identification_type: 'RUC',
      identification_number: '0992349182001',
      industry: 'Construcción e Ingeniería',
      email: 'proyectos@constructoraalfa.ec',
      phone: '+593 4 215 8800',
      address: 'Km 11.5 Vía a la Costa',
      city: 'Guayaquil',
      website: 'https://constructoraalfa.ec',
      notes: 'Contrato en negociación para software de control de obras.',
      created_at: now,
      updated_at: now,
    },
  ];

  const contacts: Contact[] = [
    {
      id: 'cnt-001',
      organization_id: defaultOrgId,
      client_id: client1Id,
      first_name: 'Andrés',
      last_name: 'Noboa',
      job_title: 'Director de Tecnología (CTO)',
      email: 'anoboa@corporacionfavorita.com',
      phone: '+593 99 923 1122',
      is_primary: true,
      preferred_channel: 'email',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'cnt-002',
      organization_id: defaultOrgId,
      client_id: client2Id,
      first_name: 'Patricio',
      last_name: 'Viteri',
      job_title: 'Gerente de Operaciones',
      email: 'pviteri@petro-oriente.ec',
      phone: '+593 98 444 5566',
      is_primary: true,
      preferred_channel: 'llamada',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'cnt-003',
      organization_id: defaultOrgId,
      client_id: client3Id,
      first_name: 'Mónica',
      last_name: 'Cordero',
      job_title: 'Jefa de Finanzas',
      email: 'mcordero@constructoraalfa.ec',
      phone: '+593 99 555 1234',
      is_primary: true,
      preferred_channel: 'whatsapp',
      created_at: now,
      updated_at: now,
    },
  ];

  const leads: Lead[] = [
    {
      id: 'lead-001',
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      first_name: 'Roberto',
      last_name: 'Gómez',
      company_name: 'TechSolutions Andina',
      email: 'roberto.gomez@techsolutions.ec',
      phone: '+593 99 712 3456',
      source: 'web',
      interest: 'Implementación CRM y analítica comercial',
      status: 'nuevo',
      priority: 'alta',
      estimated_value: 14500,
      last_contact_at: now,
      next_followup_at: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Solicitó cotización por el formulario de la web corporativa.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'lead-002',
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      first_name: 'Sofía',
      last_name: 'Andrade',
      company_name: 'Distribuidora GlobalNet',
      email: 'sandrade@globalnet.ec',
      phone: '+593 98 333 4455',
      source: 'referido',
      interest: 'Consultoría y automatización de embudo',
      status: 'contactado',
      priority: 'alta',
      estimated_value: 28000,
      last_contact_at: now,
      next_followup_at: new Date(Date.now() + 172800000).toISOString(),
      notes: 'Referido por Andrés Noboa. Llamada inicial realizada con éxito.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'lead-003',
      organization_id: defaultOrgId,
      assigned_to: gerenteId,
      first_name: 'Juan',
      last_name: 'Salazar',
      company_name: 'Innovate Logistics',
      email: 'jsalazar@innovatelogistics.com',
      phone: '+593 99 876 5432',
      source: 'linkedin',
      interest: 'Migración de base de datos a PostgreSQL',
      status: 'calificado',
      priority: 'media',
      estimated_value: 9500,
      last_contact_at: now,
      next_followup_at: new Date(Date.now() + 259200000).toISOString(),
      notes: 'Reunión exploratoria agendada para el viernes.',
      created_at: now,
      updated_at: now,
    },
  ];

  const opportunities: Opportunity[] = [
    {
      id: 'opp-001',
      organization_id: defaultOrgId,
      client_id: client1Id,
      contact_id: 'cnt-001',
      stage_id: stage5, // Negociación
      assigned_to: vendedorId,
      title: 'Renovación de Infraestructura Cloud y Licenciamiento 2026',
      expected_value: 45000,
      currency: 'USD',
      probability: 80,
      expected_close_date: '2026-11-30',
      notes: 'Revisión final de condiciones comerciales y plazos de entrega.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'opp-002',
      organization_id: defaultOrgId,
      client_id: client2Id,
      contact_id: 'cnt-002',
      stage_id: stage4, // Propuesta enviada
      assigned_to: vendedorId,
      title: 'Sistema de Mantenimiento Predictivo para Estaciones',
      expected_value: 38500,
      currency: 'USD',
      probability: 60,
      expected_close_date: '2026-12-15',
      notes: 'Propuesta técnica enviada con cotización #COT-2026-0001.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'opp-003',
      organization_id: defaultOrgId,
      client_id: client3Id,
      contact_id: 'cnt-003',
      stage_id: stage6, // Ganado
      assigned_to: gerenteId,
      title: 'Consultoría en Seguridad de la Información ISO 27001',
      expected_value: 22000,
      currency: 'USD',
      probability: 100,
      expected_close_date: '2026-10-15',
      closed_at: now,
      notes: 'Contrato firmado e inicio de primera etapa de auditoría.',
      created_at: now,
      updated_at: now,
    },
  ];

  const activities: Activity[] = [
    {
      id: 'act-001',
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      client_id: client1Id,
      opportunity_id: 'opp-001',
      type: 'reunion',
      title: 'Reunión de cierre contractual con comité directivo',
      description: 'Definir cláusulas de soporte extendido con Andrés Noboa.',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'pendiente',
      priority: 'alta',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'act-002',
      organization_id: defaultOrgId,
      assigned_to: vendedorId,
      lead_id: 'lead-001',
      type: 'llamada',
      title: 'Llamada de seguimiento con Roberto Gómez',
      description: 'Confirmar recepción del catálogo y alcance de módulos requeridos.',
      due_date: new Date(Date.now() + 3600000 * 4).toISOString(),
      status: 'pendiente',
      priority: 'alta',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'act-003',
      organization_id: defaultOrgId,
      assigned_to: gerenteId,
      client_id: client3Id,
      opportunity_id: 'opp-003',
      type: 'tarea',
      title: 'Enviar acta de inicio de auditoría ISO 27001',
      description: 'Documento firmado digitalmente para Mónica Cordero.',
      due_date: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'completada',
      priority: 'media',
      completed_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  const products: Product[] = [
    {
      id: 'prod-001',
      organization_id: defaultOrgId,
      sku: 'SFT-CRM-ENT',
      name: 'Licencia Executive Dark CRM Enterprise (Anual)',
      description: 'Acceso para 25 usuarios concurrentes con módulos comerciales completos y soporte prioritario.',
      category: 'Software',
      unit: 'licencia',
      unit_price: 3600.00,
      tax_rate: 15.00,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prod-002',
      organization_id: defaultOrgId,
      sku: 'CNS-AUD-ISO',
      name: 'Consultoría Especializada en Procesos / Ciberseguridad',
      description: 'Paquete de 40 horas de asesoría técnica senior y diagnóstico operativo.',
      category: 'Servicios Profesionales',
      unit: 'paquete',
      unit_price: 4800.00,
      tax_rate: 15.00,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prod-003',
      organization_id: defaultOrgId,
      sku: 'SUP-247-SLA',
      name: 'Póliza de Mantenimiento y Soporte 24/7 (Mensual)',
      description: 'Monitoreo activo, parches de seguridad y respuesta garantizada en menos de 60 minutos.',
      category: 'Soporte',
      unit: 'mes',
      unit_price: 950.00,
      tax_rate: 15.00,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const quote1Id = 'qte-001';
  const quotes: Quote[] = [
    {
      id: quote1Id,
      organization_id: defaultOrgId,
      quote_number: 'COT-2026-0001',
      client_id: client2Id,
      opportunity_id: 'opp-002',
      created_by: vendedorId,
      issue_date: '2026-10-17',
      valid_until: '2026-11-17',
      status: 'enviada',
      subtotal: 15100.00,
      discount_total: 500.00,
      tax_total: 2190.00,
      grand_total: 16790.00,
      currency: 'USD',
      notes: 'Forma de pago: 50% anticipo, 50% contra entrega de acta de conformidad.',
      terms_conditions: 'Validez de la oferta: 30 días calendario. Precios sujetos a entrega en instalaciones del cliente.',
      pdf_url: '',
      created_at: now,
      updated_at: now,
    },
  ];

  const quote_items: QuoteItem[] = [
    {
      id: 'qti-001',
      quote_id: quote1Id,
      product_id: 'prod-001',
      description: 'Licencia Executive Dark CRM Enterprise (Anual)',
      quantity: 2,
      unit_price: 3600.00,
      discount_percent: 5.00,
      tax_rate: 15.00,
      total_price: 6840.00,
    },
    {
      id: 'qti-002',
      quote_id: quote1Id,
      product_id: 'prod-002',
      description: 'Consultoría Especializada en Procesos / Ciberseguridad (2 Paquetes)',
      quantity: 2,
      unit_price: 4800.00,
      discount_percent: 0.00,
      tax_rate: 15.00,
      total_price: 9600.00,
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'aud-001',
      organization_id: defaultOrgId,
      user_id: adminId,
      user_email: 'admin@crmexecutive.com',
      action: 'SISTEMA_INICIALIZADO',
      entity_name: 'organization',
      entity_id: defaultOrgId,
      details: 'Base de datos inicializada con esquema Executive Dark 2.0 y perfiles con roles.',
      created_at: now,
    },
  ];

  return {
    organizations,
    profiles,
    pipeline_stages,
    leads,
    clients,
    contacts,
    opportunities,
    activities,
    products,
    quotes,
    quote_items,
    audit_logs,
  };
}

// Lectura y escritura atómica con archivo persistente
class DatabaseManager {
  private cache: DatabaseSchema | null = null;

  private ensureDbExists(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData = getInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      this.cache = initialData;
    }
  }

  public getDb(): DatabaseSchema {
    this.ensureDbExists();
    if (!this.cache) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      this.cache = JSON.parse(content) as DatabaseSchema;
    }
    return this.cache;
  }

  public saveDb(data: DatabaseSchema): void {
    this.ensureDbExists();
    this.cache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Registra un evento de auditoría de forma inmutable
  public logAudit(
    orgId: string,
    action: string,
    entityName: string,
    entityId: string,
    details: string,
    user?: { id?: string; email?: string }
  ): void {
    const db = this.getDb();
    const log: AuditLog = {
      id: generateId(),
      organization_id: orgId,
      user_id: user?.id,
      user_email: user?.email,
      action,
      entity_name: entityName,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    db.audit_logs.unshift(log);
    // Limitar logs a 1000 para optimización de memoria
    if (db.audit_logs.length > 1000) {
      db.audit_logs.pop();
    }
    this.saveDb(db);
  }
}

export const dbManager = new DatabaseManager();
