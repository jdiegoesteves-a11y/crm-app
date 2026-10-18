import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { SessionUser, UserRole } from '@/types/database';

const COOKIE_NAME = 'crm_session';
const SECRET_KEY = process.env.JWT_SECRET || 'executive_dark_jwt_secret_key_minimum_32_characters_long_987654321';
const ENCODED_KEY = new TextEncoder().encode(SECRET_KEY);

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ENCODED_KEY);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, ENCODED_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Control de Acceso Basado en Roles (RBAC)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  gerente: 3,
  vendedor: 2,
  consulta: 1,
};

export function canAccessRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function isActionAllowed(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
