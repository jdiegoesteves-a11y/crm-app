-- ============================================================
-- ESQUEMA SUPABASE — CRM Executive Dark 2.0
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla única que almacena todo el estado del CRM como JSONB
-- (migración mínima del código, sin cambiar interfaces existentes)

CREATE TABLE IF NOT EXISTS crm_state (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para acelerar lecturas frecuentes
CREATE INDEX IF NOT EXISTS idx_crm_state_updated ON crm_state (updated_at DESC);

-- Política de seguridad: solo el service role puede acceder
-- (el frontend nunca llama directamente a Supabase)
ALTER TABLE crm_state ENABLE ROW LEVEL SECURITY;

-- Sin políticas públicas: solo acceso vía service_role key (desde el servidor)
-- Esto garantiza que ningún usuario del navegador pueda leer/escribir directamente.
