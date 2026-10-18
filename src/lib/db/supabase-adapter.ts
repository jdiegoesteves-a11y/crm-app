/**
 * Adaptador de Supabase para CRM Executive Dark 2.0
 *
 * Almacena toda la base de datos CRM como un documento JSONB único en Supabase.
 * Esto permite migración mínima del código existente (sin cambiar las interfaces).
 *
 * Tabla requerida en Supabase:
 *   CREATE TABLE crm_state (
 *     key  TEXT PRIMARY KEY,
 *     data JSONB NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Flag para saber si Supabase está configurado
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no configurado: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos.');
    }
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

const CRM_STATE_KEY = 'main';
const CRM_TABLE = 'crm_state';

/**
 * Lee el estado completo de la base de datos desde Supabase.
 * Retorna null si no existe (primera inicialización).
 */
export async function readFromSupabase<T>(): Promise<T | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from(CRM_TABLE)
      .select('data')
      .eq('key', CRM_STATE_KEY)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseAdapter] Error al leer:', error.message);
      return null;
    }

    return (data?.data as T) ?? null;
  } catch (err) {
    console.error('[SupabaseAdapter] Error de conexión:', err);
    return null;
  }
}

/**
 * Escribe el estado completo de la base de datos en Supabase.
 */
export async function writeToSupabase<T>(state: T): Promise<void> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(CRM_TABLE).upsert(
      {
        key: CRM_STATE_KEY,
        data: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (error) {
      console.error('[SupabaseAdapter] Error al escribir:', error.message);
    }
  } catch (err) {
    console.error('[SupabaseAdapter] Error de conexión al escribir:', err);
  }
}
