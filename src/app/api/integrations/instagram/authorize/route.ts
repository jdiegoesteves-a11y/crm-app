import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { instagramClient } from '@/lib/instagram/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return NextResponse.redirect(new URL('/configuracion?error=no_autorizado', request.url));
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.APP_BASE_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/integrations/instagram/callback`;

    const state = Buffer.from(
      JSON.stringify({
        orgId: session.organization_id,
        userId: session.id,
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    const authUrl = instagramClient.getAuthorizationUrl(redirectUri, state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error al iniciar autorización de Instagram:', error);
    return NextResponse.redirect(new URL('/configuracion/integraciones/instagram?error=error_inicio_oauth', request.url));
  }
}
