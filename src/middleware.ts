import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { SessionUser, UserRole } from '@/types/database';

const COOKIE_NAME = 'crm_session';
const SECRET_KEY = process.env.JWT_SECRET || 'executive_dark_jwt_secret_key_minimum_32_characters_long_987654321';
const ENCODED_KEY = new TextEncoder().encode(SECRET_KEY);

const PUBLIC_PATHS = ['/login', '/recuperar-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, imágenes y favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionUser: SessionUser | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, ENCODED_KEY);
      sessionUser = payload as unknown as SessionUser;
    } catch {
      sessionUser = null;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // 1. Si no hay sesión válida y la ruta es protegida o raíz -> Redirigir a /login
  if (!sessionUser && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si hay sesión y se intenta acceder a / o a rutas públicas (/login) -> Redirigir a /dashboard
  if (sessionUser && (isPublicPath || pathname === '/')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Control de acceso por Roles (RBAC) en rutas restringidas
  if (sessionUser) {
    const role: UserRole = sessionUser.role;

    // Solo 'admin' puede acceder a gestión de usuarios
    if (pathname.startsWith('/configuracion/usuarios') && role !== 'admin') {
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'acceso_denegado');
      return NextResponse.redirect(dashboardUrl);
    }

    // Solo 'admin' y 'gerente' pueden acceder a configuración general y reportes avanzados
    if (
      (pathname.startsWith('/configuracion') && !['admin', 'gerente'].includes(role)) ||
      (pathname.startsWith('/reportes') && !['admin', 'gerente'].includes(role))
    ) {
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'acceso_denegado');
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
