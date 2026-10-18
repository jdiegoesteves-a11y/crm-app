-- ============================================================
-- ESQUEMA SUPABASE — CRM Executive Dark 2.0
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tabla única que almacena todo el estado del CRM como JSONB
CREATE TABLE IF NOT EXISTS crm_state (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPORTANTE: RLS deshabilitado porque esta tabla solo la accede
-- el servidor Next.js (nunca el navegador del cliente directamente)
ALTER TABLE crm_state DISABLE ROW LEVEL SECURITY;
