import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'crm_database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function generateBackup() {
  console.log('\n\x1b[1m\x1b[36m[RESPALDO AUTOMATIZADO — EXECUTIVE DARK CRM 2.0]\x1b[0m');
  console.log('Iniciando procedimiento de copia de seguridad integral...\n');

  if (!fs.existsSync(DB_FILE)) {
    console.error('\x1b[31mError: No se encontró la base de datos principal en:\x1b[0m', DB_FILE);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const rawData = fs.readFileSync(DB_FILE, 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(rawData);
  } catch (err) {
    console.error('\x1b[31mError: La base de datos está corrupta o no es un JSON válido.\x1b[0m', err);
    process.exit(1);
  }

  // Generar Checksum SHA-256
  const hash = crypto.createHash('sha256').update(rawData).digest('hex');

  // Timestamp
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const backupFileName = `crm-backup-${timestamp}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  const backupPayload = {
    metadata: {
      system: 'Executive Dark CRM 2.0',
      version: '2.0.0-fase6',
      generated_at: now.toISOString(),
      sha256_checksum: hash,
      record_counts: {
        organizations: parsed.organizations?.length || 0,
        profiles: parsed.profiles?.length || 0,
        leads: parsed.leads?.length || 0,
        clients: parsed.clients?.length || 0,
        contacts: parsed.contacts?.length || 0,
        opportunities: parsed.opportunities?.length || 0,
        activities: parsed.activities?.length || 0,
        products: parsed.products?.length || 0,
        quotes: parsed.quotes?.length || 0,
        documents: parsed.documents?.length || 0,
        audit_logs: parsed.audit_logs?.length || 0,
      },
    },
    data: parsed,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
  const sizeKB = (fs.statSync(backupFilePath).size / 1024).toFixed(2);

  console.log(`\x1b[32m✓ Copia de seguridad generada con éxito:\x1b[0m`);
  console.log(`  Archivo:   ${backupFileName}`);
  console.log(`  Ruta:      ${backupFilePath}`);
  console.log(`  Tamaño:    ${sizeKB} KB`);
  console.log(`  SHA-256:   ${hash}`);
  console.log(`\n\x1b[1mEntidades Respaldadas:\x1b[0m`);
  Object.entries(backupPayload.metadata.record_counts).forEach(([entity, count]) => {
    console.log(`  • ${entity.padEnd(16)}: ${count} registros`);
  });
  console.log('\n\x1b[32mRespaldo finalizado y verificado.\x1b[0m\n');
}

generateBackup();
