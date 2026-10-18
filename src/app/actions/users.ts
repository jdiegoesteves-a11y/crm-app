'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Profile, UserRole } from '@/types/database';

const createUserSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  role: z.enum(['admin', 'gerente', 'vendedor', 'consulta']),
  phone: z.string().optional(),
  password: z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
});

export async function createUserAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado: Solo administradores pueden crear usuarios.' };
    }

    const rawData = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      phone: (formData.get('phone') as string) || undefined,
      password: formData.get('password') as string,
    };

    const parsed = createUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del usuario inválidos' };
    }

    const { full_name, email, role, phone, password } = parsed.data;
    const db = dbManager.getDb();

    // Validar si el correo ya existe
    const exists = db.profiles.some(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.organization_id === session.organization_id
    );

    if (exists) {
      return { success: false, error: 'Ya existe un usuario registrado con este correo electrónico.' };
    }

    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: generateId(),
      organization_id: session.organization_id,
      email: email.toLowerCase(),
      full_name,
      role: role as UserRole,
      is_active: true,
      phone,
      password_hash: bcrypt.hashSync(password, 10),
      created_at: now,
      updated_at: now,
    };

    db.profiles.push(newProfile);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_USUARIO',
      'profile',
      newProfile.id,
      `Usuario ${email} creado con rol [${role}] por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/configuracion/usuarios');
    return { success: true, message: `Usuario ${full_name} creado exitosamente.` };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: 'Ocurrió un error inesperado al crear el usuario.' };
  }
}

export async function toggleUserStatusAction(userId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado: Solo administradores pueden modificar estados de usuarios.' };
    }

    if (session.id === userId) {
      return { success: false, error: 'Por seguridad, no puede desactivar su propia cuenta de administrador.' };
    }

    const db = dbManager.getDb();
    const profile = db.profiles.find((p) => p.id === userId && p.organization_id === session.organization_id);

    if (!profile) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    profile.is_active = !profile.is_active;
    profile.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      profile.is_active ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
      'profile',
      profile.id,
      `Estado cambiado a ${profile.is_active ? 'ACTIVO' : 'INACTIVO'} por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/configuracion/usuarios');
    return { success: true, isActive: profile.is_active };
  } catch {
    return { success: false, error: 'Error al cambiar estado del usuario.' };
  }
}

export async function updateUserRoleAction(userId: string, newRole: UserRole) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado: Solo administradores pueden cambiar roles.' };
    }

    const db = dbManager.getDb();
    const profile = db.profiles.find((p) => p.id === userId && p.organization_id === session.organization_id);

    if (!profile) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    // Si se está cambiando el propio rol de admin, asegurar que quede al menos otro admin activo
    if (session.id === userId && newRole !== 'admin') {
      const activeAdmins = db.profiles.filter(
        (p) => p.role === 'admin' && p.is_active && p.organization_id === session.organization_id
      );
      if (activeAdmins.length <= 1) {
        return { success: false, error: 'No puede remover su propio rol de Administrador si es el único activo.' };
      }
    }

    const oldRole = profile.role;
    profile.role = newRole;
    profile.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CAMBIO_ROL_USUARIO',
      'profile',
      profile.id,
      `Rol cambiado de [${oldRole}] a [${newRole}] por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/configuracion/usuarios');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al actualizar rol.' };
  }
}
