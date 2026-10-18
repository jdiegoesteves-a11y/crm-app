export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'consulta';

export type LeadStatus = 'nuevo' | 'contactado' | 'calificado' | 'descartado' | 'convertido';
export type PriorityLevel = 'baja' | 'media' | 'alta';

export type ClientType = 'empresa' | 'persona';

export type ActivityType = 'llamada' | 'reunion' | 'tarea' | 'visita' | 'email' | 'nota';
export type ActivityStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';

export interface Organization {
  id: string;
  name: string;
  tax_id: string; // RUC o Identificación tributaria
  currency: string; // 'USD' por defecto
  timezone: string; // 'America/Guayaquil' por defecto
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  password_hash?: string; // Solo en persistencia interna segura
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  order_index: number;
  probability: number; // 0 - 100
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  assigned_to: string; // Profile ID
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  source: string; // 'web', 'referido', 'linkedin', 'feria', 'otro'
  interest: string;
  status: LeadStatus;
  priority: PriorityLevel;
  estimated_value: number;
  last_contact_at?: string;
  next_followup_at?: string;
  notes?: string;
  converted_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  assigned_to: string; // Profile ID
  type: ClientType;
  name: string; // Razón social o Nombre completo
  identification_type: string; // 'RUC', 'Cedula', 'Pasaporte'
  identification_number: string;
  industry?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  email: string;
  phone?: string;
  is_primary: boolean;
  preferred_channel?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  organization_id: string;
  client_id: string;
  contact_id?: string;
  stage_id: string;
  assigned_to: string; // Profile ID
  title: string;
  expected_value: number;
  currency: string; // 'USD'
  probability: number;
  expected_close_date: string;
  closed_at?: string;
  lost_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  assigned_to: string;
  client_id?: string;
  opportunity_id?: string;
  lead_id?: string;
  type: ActivityType;
  title: string;
  description?: string;
  due_date: string;
  status: ActivityStatus;
  priority: PriorityLevel;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string; // 'unidad', 'hora', 'mes', 'servicio'
  unit_price: number;
  tax_rate: number; // Ej. 15.00 para IVA 15%
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  total_price: number;
}

export interface Quote {
  id: string;
  organization_id: string;
  quote_number: string; // 'COT-2026-0001'
  client_id: string;
  opportunity_id?: string;
  created_by: string; // Profile ID
  issue_date: string;
  valid_until: string;
  status: QuoteStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  currency: string;
  notes?: string;
  terms_conditions?: string;
  pdf_url?: string;
  items?: QuoteItem[];
  created_at: string;
  updated_at: string;
}

export type DocumentEntityType = 'client' | 'opportunity' | 'quote' | 'general';

export interface DocumentAttachment {
  id: string;
  organization_id: string;
  uploaded_by: string;
  entity_type: DocumentEntityType;
  entity_id?: string;
  file_name: string;
  file_path: string;
  file_size: number; // en bytes
  mime_type: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface SessionUser {
  id: string;
  organization_id: string;
  organization_name: string;
  currency: string;
  timezone: string;
  email: string;
  full_name: string;
  role: UserRole;
}

// ==========================================
// CANALES OMNICANAL Y MENSAJERÍA DIRECTA
// ==========================================
export type ChannelProvider = 'instagram' | 'whatsapp' | 'messenger';
export type IntegrationStatus = 'conectado' | 'desconectado' | 'error' | 'pendiente';
export type ConversationStatus = 'sin_asignar' | 'pendiente' | 'en_atencion' | 'resuelta';
export type MessageSenderType = 'contact' | 'agent' | 'system';
export type MessageDeliveryStatus = 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'fallido';
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'none';

export interface ChannelIntegration {
  id: string;
  organization_id: string;
  provider: ChannelProvider;
  app_id: string;
  app_name?: string;
  account_id?: string; // Instagram User ID
  account_username?: string; // @username
  access_token?: string; // Token de larga duración
  token_expires_at?: string;
  status: IntegrationStatus;
  webhook_verified: boolean;
  webhook_url?: string;
  last_sync_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  channel: ChannelProvider;
  external_id: string; // ID del hilo o remitente (IGSID)
  contact_external_id: string; // IGSID en Instagram
  contact_name?: string;
  contact_username?: string;
  contact_avatar_url?: string;
  lead_id?: string;
  client_id?: string;
  assigned_to?: string; // Profile ID
  status: ConversationStatus;
  last_message_text: string;
  last_message_at: string;
  unread_count: number;
  window_expires_at?: string; // Límite de 24 horas de Meta
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  organization_id: string;
  external_id?: string; // Meta message ID (mid) para idempotencia
  sender_type: MessageSenderType;
  sender_id?: string; // Profile ID si es agente, IGSID si es cliente
  sender_name: string;
  content: string;
  media_url?: string;
  media_type: MediaType;
  status: MessageDeliveryStatus;
  error_details?: string;
  is_internal_note: boolean;
  created_at: string;
}
