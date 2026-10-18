'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbManager } from '@/lib/db';
import { signSession, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth/session';
import { SessionUser } from '@/types/database';

const loginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de acceso incompletos',
      };
    }

    const { email, password } = parsed.data;
    const db = await dbManager.getDb();

    // Buscar perfil por correo (insensible a mayúsculas)
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );

    if (!profile) {
      return {
        success: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña.',
      };
    }

    if (!profile.is_active) {
      return {
        success: false,
        error: 'Su cuenta se encuentra desactivada. Contacte a un administrador.',
      };
    }

    // Verificar hash de contraseña
    const isPasswordValid = profile.password_hash
      ? bcrypt.compareSync(password, profile.password_hash)
      : false;

    if (!isPasswordValid) {
      try {
        await dbManager.logAudit(
          profile.organization_id,
          'INTENTO_LOGIN_FALLIDO',
          'profile',
          profile.id,
          `Contraseña errónea para el usuario ${email}`,
          { id: profile.id, email: profile.email }
        );
      } catch (e) {
        console.warn('Aviso: no se pudo escribir log de auditoría:', e);
      }
      return {
        success: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña (contraseña por defecto: Password123!).',
      };
    }

    // Obtener organización asociada
    const org = db.organizations.find((o) => o.id === profile.organization_id);
    const orgName = org ? org.name : 'Organización Comercial';
    const currency = org ? org.currency : 'USD';
    const timezone = org ? org.timezone : 'America/Guayaquil';

    // Actualizar último acceso
    profile.last_login_at = new Date().toISOString();
    await dbManager.saveDb(db);

    // Crear sesión JWT segura
    const sessionUser: SessionUser = {
      id: profile.id,
      organization_id: profile.organization_id,
      organization_name: orgName,
      currency,
      timezone,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
    };

    const token = await signSession(sessionUser);
    await setSessionCookie(token);

    // Registrar en bitácora de auditoría de forma segura
    try {
      await dbManager.logAudit(
        profile.organization_id,
        'LOGIN_EXITOSO',
        'profile',
        profile.id,
        `Sesión iniciada con rol [${profile.role}]`,
        { id: profile.id, email: profile.email }
      );
    } catch (e) {
      console.warn('Aviso: no se pudo escribir log de auditoría:', e);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error en loginAction:', error);
    return {
      success: false,
      error: error?.message
        ? `Error al autenticar: ${error.message}`
        : 'Ocurrió un error inesperado al procesar el ingreso. Intente nuevamente.',
    };
  }
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await dbManager.logAudit(
      session.organization_id,
      'LOGOUT',
      'profile',
      session.id,
      'Cierre de sesión seguro',
      { id: session.id, email: session.email }
    );
  }
  await clearSessionCookie();
  return { success: true };
}

const resetSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido'),
});

export async function requestPasswordResetAction(prevState: unknown, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const parsed = resetSchema.safeParse({ email });

    if (!parsed.success) {
      return { success: false, error: 'Ingrese una dirección de correo válida.' };
    }

    const db = await dbManager.getDb();
    const profile = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (profile) {
      await dbManager.logAudit(
        profile.organization_id,
        'SOLICITUD_RECUPERACION_PASSWORD',
        'profile',
        profile.id,
        `Se solicitó restablecer contraseña para ${profile.email}`,
        { id: profile.id, email: profile.email }
      );
    }

    // Por seguridad, se responde de manera genérica para evitar enumeración de correos
    return {
      success: true,
      message: 'Si el correo está registrado en el sistema, recibirá las instrucciones para restablecer su contraseña.',
    };
  } catch {
    return { success: false, error: 'Error al procesar la solicitud.' };
  }
}
