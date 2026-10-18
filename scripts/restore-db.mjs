import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'crm_database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function restoreBackup() {
  console.log('\n\x1b[1m\x1b[36m[RESTAURACIÓN DE BASE DE DATOS — EXECUTIVE DARK CRM 2.0]\x1b[0m');
  console.log('Iniciando procedimiento de recuperación ante desastres...\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('\x1b[31mError: No existe el directorio de respaldos en:\x1b[0m', BACKUP_DIR);
    process.exit(1);
  }

  // Buscar archivo especificado en argumentos o el más reciente
  const targetArg = process.argv[2];
  let targetFile;

  if (targetArg) {
    targetFile = path.isAbsolute(targetArg) ? targetArg : path.join(BACKUP_DIR, targetArg);
  } else {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json'));
    if (files.length === 0) {
      console.error('\x1b[31mError: No hay copias de seguridad disponibles para restaurar.\x1b[0m');
      process.exit(1);
    }
    // Ordenar por fecha descendente
    files.sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);
    targetFile = path.join(BACKUP_DIR, files[0]);
    console.log(`No se especificó archivo. Usando el respaldo más reciente: \x1b[33m${files[0]}\x1b[0m\n`);
  }

  if (!fs.existsSync(targetFile)) {
    console.error(`\x1b[31mError: El archivo de respaldo no existe:\x1b[0m ${targetFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(targetFile, 'utf-8');
  let backupData;
  try {
    backupData = JSON.parse(rawContent);
  } catch (err) {
    console.error('\x1b[31mError: El archivo de respaldo está corrupto.\x1b[0m', err);
    process.exit(1);
  }

  const restoredDb = backupData.data || backupData;

  // Validación de integridad
  if (!Array.isArray(restoredDb.organizations) || !Array.isArray(restoredDb.profiles)) {
    console.error('\x1b[31mError: Estructura de esquema inválida en el respaldo.\x1b[0m');
    process.exit(1);
  }

  // Crear snapshot de seguridad del estado actual antes de sobrescribir
  if (fs.existsSync(DB_FILE)) {
    const preRestoreFile = path.join(BACKUP_DIR, `pre-restore-safety-${Date.now()}.json`);
    fs.copyFileSync(DB_FILE, preRestoreFile);
    console.log(`Snapshot de seguridad creado antes de restaurar: ${path.basename(preRestoreFile)}`);
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(restoredDb, null, 2), 'utf-8');

  console.log(`\n\x1b[32m✓ Base de datos restaurada exitosamente.\x1b[0m`);
  console.log(`  Organizaciones:  ${restoredDb.organizations?.length || 0}`);
  console.log(`  Perfiles/Usuarios: ${restoredDb.profiles?.length || 0}`);
  console.log(`  Oportunidades:   ${restoredDb.opportunities?.length || 0}`);
  console.log(`  Cotizaciones:    ${restoredDb.quotes?.length || 0}`);
  console.log('\n\x1b[32mProcedimiento de recuperación completado con éxito.\x1b[0m\n');
}

restoreBackup();
