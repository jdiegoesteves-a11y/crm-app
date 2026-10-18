-- ==============================================================================
-- CRM EXECUTIVE DARK 2.0 - ESQUEMA DE BASE DE DATOS POSTGRESQL CON RLS
-- Migración 001: Esquema Base, Multi-Tenancy y Control de Acceso por Roles (RBAC)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'vendedor', 'consulta');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('nuevo', 'contactado', 'calificado', 'descartado', 'convertido');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('baja', 'media', 'alta');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('empresa', 'persona');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('llamada', 'reunion', 'tarea', 'visita', 'email', 'nota');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_status AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA ORGANIZACIONES (TENANTS)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Guayaquil',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'vendedor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  phone TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA ETAPAS DEL EMBUDO COMERCIAL
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  probability INT NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA CLIENTES (EMPRESAS / PERSONAS)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type client_type NOT NULL DEFAULT 'empresa',
  name TEXT NOT NULL,
  identification_type TEXT NOT NULL DEFAULT 'RUC',
  identification_number TEXT NOT NULL,
  industry TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_client_org_id_num UNIQUE (organization_id, identification_number)
);

-- 7. TABLA CONTACTOS (PERSONAS POR CLIENTE)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  preferred_channel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA PROSPECTOS (LEADS)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  interest TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'nuevo',
  priority priority_level NOT NULL DEFAULT 'media',
  estimated_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  notes TEXT,
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLA OPORTUNIDADES (DEALS)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  expected_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  probability INT NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE NOT NULL,
  closed_at TIMESTAMPTZ,
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA ACTIVIDADES Y TAREAS
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type activity_type NOT NULL DEFAULT 'tarea',
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status activity_status NOT NULL DEFAULT 'pendiente',
  priority priority_level NOT NULL DEFAULT 'media',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABLA CATÁLOGO DE PRODUCTOS / SERVICIOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  unit TEXT NOT NULL DEFAULT 'unidad',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00, -- IVA Ecuador 15%
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_org_sku UNIQUE (organization_id, sku)
);

-- 12. TABLA COTIZACIONES
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status quote_status NOT NULL DEFAULT 'borrador',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  notes TEXT,
  terms_conditions TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_quote_org_number UNIQUE (organization_id, quote_number)
);

-- 13. TABLA ÍTEMS DE COTIZACIÓN
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 14. TABLA AUDITORÍA Y TRAZABILIDAD (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_activities_org_due ON activities(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);

-- POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper para obtener la organización del usuario autenticado
CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- POLÍTICAS RLS: Aislamiento por organization_id
CREATE POLICY rls_org_isolation_profiles ON profiles
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_clients ON clients
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_contacts ON contacts
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_leads ON leads
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_opportunities ON opportunities
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_activities ON activities
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_products ON products
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_quotes ON quotes
  FOR ALL USING (organization_id = auth_user_org_id());

CREATE POLICY rls_org_isolation_audit_logs ON audit_logs
  FOR ALL USING (organization_id = auth_user_org_id());
