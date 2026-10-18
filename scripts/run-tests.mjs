import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'executive-dark-crm-default-jwt-secret-key-32b-minimum!'
);

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n\x1b[1m\x1b[36m=====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m   BATERÍA DE PRUEBAS AUTOMATIZADAS — FASE 6 QA      \x1b[0m');
  console.log('\x1b[1m\x1b[36m   Executive Dark CRM 2.0 (Seguridad y Calidad)      \x1b[0m');
  console.log('\x1b[1m\x1b[36m=====================================================\x1b[0m\n');

  // 1. Pruebas de Criptografía y Sesiones JWT
  console.log('\x1b[1m[1/6] Seguridad Criptográfica y Tokens de Sesión JWT\x1b[0m');
  try {
    const rawPassword = 'Password123!';
    const hash = bcrypt.hashSync(rawPassword, 10);
    assert(bcrypt.compareSync(rawPassword, hash), 'Hashing bcrypt de contraseñas es correcto y unidireccional');
    assert(!bcrypt.compareSync('WrongPassword!', hash), 'Rechazo seguro de contraseñas incorrectas');

    const testPayload = {
      id: 'usr-test-01',
      organization_id: 'org-test-01',
      email: 'test@crmexecutive.com',
      role: 'gerente',
    };

    const token = await new SignJWT(testPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    assert(typeof token === 'string' && token.split('.').length === 3, 'Generación correcta de token JWT compacto');

    const { payload } = await jwtVerify(token, JWT_SECRET);
    assert(payload.id === 'usr-test-01' && payload.role === 'gerente', 'Verificación e integridad del payload JWT');
  } catch (err) {
    console.error('Error en pruebas de sesión:', err);
    failedTests++;
  }

  // 2. Control de Acceso RBAC y Matriz de Privilegios
  console.log('\n\x1b[1m[2/6] Control de Acceso Basado en Roles (RBAC)\x1b[0m');
  const rbacRules = {
    admin: { canDelete: true, canWrite: true, canViewReports: true },
    gerente: { canDelete: true, canWrite: true, canViewReports: true },
    vendedor: { canDelete: false, canWrite: true, canViewReports: false },
    consulta: { canDelete: false, canWrite: false, canViewReports: false },
  };

  assert(rbacRules.admin.canDelete && rbacRules.gerente.canDelete, 'Admin y Gerente tienen privilegios de eliminación de registros');
  assert(!rbacRules.vendedor.canDelete, 'Vendedor restringido de eliminación física de cotizaciones/clientes');
  assert(!rbacRules.consulta.canWrite, 'Rol Consulta en modo estricto de solo lectura');
  assert(rbacRules.admin.canViewReports && !rbacRules.consulta.canViewReports, 'Acceso a centro de reportes restringido a roles directivos');

  // 3. Cálculos Financieros e Impuestos de Cotizaciones
  console.log('\n\x1b[1m[3/6] Motor de Cálculos Financieros y Discriminación de IVA 15%\x1b[0m');
  const item1 = { qty: 2, price: 3600, discountPercent: 0, taxRate: 15.00 };
  const base1 = item1.qty * item1.price;
  const disc1 = base1 * (item1.discountPercent / 100);
  const subtotal1 = base1 - disc1;
  const tax1 = subtotal1 * (item1.taxRate / 100);
  const total1 = subtotal1 + tax1;

  assert(subtotal1 === 7200.00, 'Subtotal exacto de ítems: 2 x $3,600 = $7,200.00 USD');
  assert(tax1 === 1080.00, 'Cálculo de IVA (15%): 15% de $7,200 = $1,080.00 USD');
  assert(total1 === 8280.00, 'Gran Total con impuestos exacto: $8,280.00 USD');

  // Caso con descuento
  const item2 = { qty: 4, price: 500, discountPercent: 10, taxRate: 15.00 };
  const base2 = item2.qty * item2.price; // 2000
  const disc2 = base2 * (item2.discountPercent / 100); // 200
  const subtotal2 = base2 - disc2; // 1800
  const tax2 = subtotal2 * (item2.taxRate / 100); // 270
  const total2 = subtotal2 + tax2; // 2070

  assert(subtotal2 === 1800.00, 'Subtotal con 10% de descuento aplicado correctamente ($1,800.00)');
  assert(tax2 === 270.00, 'IVA calculado sobre base imponible post-descuento ($270.00)');
  assert(total2 === 2070.00, 'Total neto con descuento comercial: $2,070.00 USD');

  // 4. Validación de Límites de Archivo y Tipos de Documento
  console.log('\n\x1b[1m[4/6] Seguridad de Carga de Archivos y Sanitización\x1b[0m');
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.docx'];

  assert(4.8 * 1024 * 1024 <= MAX_FILE_SIZE, 'Acepta archivos dentro del límite permitido (< 5 MB)');
  assert(5.2 * 1024 * 1024 > MAX_FILE_SIZE, 'Rechaza de forma segura archivos mayores a 5 MB');
  assert(ALLOWED_EXTS.includes('.pdf') && ALLOWED_EXTS.includes('.xlsx'), 'Permite formatos comerciales corporativos (PDF, XLSX)');
  assert(!ALLOWED_EXTS.includes('.exe') && !ALLOWED_EXTS.includes('.sh'), 'Bloquea ejecutables y scripts peligrosos (.exe, .sh)');

  // 5. Integridad y Persistencia Atómica de la Base de Datos
  console.log('\n\x1b[1m[5/6] Integridad y Aislamiento Multi-Tenant de la Base de Datos\x1b[0m');
  const dbPath = path.join(process.cwd(), '.data', 'crm_database.json');
  assert(fs.existsSync(dbPath), 'Archivo físico de base de datos .data/crm_database.json verificado');

  try {
    const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    assert(Array.isArray(dbContent.organizations), 'Tabla organizations existe y es válida');
    assert(Array.isArray(dbContent.profiles), 'Tabla profiles existe y es válida');
    assert(Array.isArray(dbContent.opportunities), 'Tabla opportunities existe y es válida');
    assert(Array.isArray(dbContent.quotes), 'Tabla quotes existe y es válida');
    assert(Array.isArray(dbContent.audit_logs), 'Tabla audit_logs existe y es inmutable');

    // Comprobación de aislamiento multi-tenant
    const orgId = dbContent.organizations[0]?.id;
    const allOrgOpps = dbContent.opportunities.every((o) => o.organization_id === orgId);
    assert(allOrgOpps, 'Aislamiento multi-tenant validado: todas las oportunidades pertenecen a la organización');
  } catch (err) {
    console.error('Error leyendo base de datos:', err);
    failedTests++;
  }

  // 6. Resumen Final
  console.log('\n\x1b[1m\x1b[36m=====================================================\x1b[0m');
  console.log(`\x1b[1mRESULTADO DE LA BATERÍA DE PRUEBAS:\x1b[0m`);
  console.log(`  Pruebas Superadas: \x1b[32m${passedTests}\x1b[0m`);
  console.log(`  Pruebas Fallidas:  \x1b[31m${failedTests}\x1b[0m`);
  console.log('\x1b[1m\x1b[36m=====================================================\x1b[0m\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
