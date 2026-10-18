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

-- IMPORTANTE: Esta tabla solo es accedida por el servidor Next.js
-- Ejecuta estas líneas para permitir lectura y escritura:
ALTER TABLE crm_state DISABLE ROW LEVEL SECURITY;

-- Política de respaldo en caso de que RLS permanezca activado:
DROP POLICY IF EXISTS "crm_state_full_access" ON crm_state;
CREATE POLICY "crm_state_full_access" ON crm_state FOR ALL USING (true) WITH CHECK (true);
