import { NextRequest, NextResponse } from 'next/server';
import { dbManager, generateId } from '@/lib/db';
import { instagramClient } from '@/lib/instagram/client';
import { ChannelIntegration } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');

  if (error || !code) {
    console.warn('[Instagram Callback] Error o cancelación en autorización:', { error, errorReason, errorDescription });
    const errText = encodeURIComponent(errorDescription || error || 'Autorización cancelada');
    return NextResponse.redirect(new URL(`/configuracion/integraciones/instagram?error=${errText}`, request.url));
  }

  try {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.APP_BASE_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/integrations/instagram/callback`;

    // 1. Canjear código por token de corta duración
    const shortTokenRes = await instagramClient.exchangeCodeForToken(code, redirectUri);

    // 2. Canjear por token de larga duración (60 días)
    let longLivedToken = shortTokenRes.access_token;
    let expiresInSec = 5184000; // 60 días por defecto

    try {
      const longTokenRes = await instagramClient.exchangeForLongLivedToken(shortTokenRes.access_token);
      longLivedToken = longTokenRes.access_token;
      expiresInSec = longTokenRes.expires_in;
    } catch (e) {
      console.warn('[Instagram Callback] No se pudo canjear por token de larga duración, usando token base:', e);
    }

    // 3. Obtener perfil de la cuenta
    let username = 'cuenta_instagram';
    let accountId = shortTokenRes.user_id;

    try {
      const profile = await instagramClient.getUserProfile(longLivedToken);
      username = profile.username;
      accountId = profile.user_id;
    } catch (e) {
      console.warn('[Instagram Callback] Error al consultar perfil /me:', e);
    }

    // 4. Guardar o actualizar integración en la base de datos
    const db = dbManager.getDb();
    const defaultOrg = db.organizations[0];
    const orgId = defaultOrg?.id || 'org-acme-001';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSec * 1000).toISOString();

    let integration = db.integrations.find(
      (i) => i.organization_id === orgId && i.provider === 'instagram'
    );

    if (integration) {
      integration.account_id = accountId;
      integration.account_username = username;
      integration.access_token = longLivedToken;
      integration.token_expires_at = expiresAt;
      integration.status = 'conectado';
      integration.webhook_verified = true;
      integration.last_sync_at = now.toISOString();
      integration.last_error = undefined;
      integration.updated_at = now.toISOString();
    } else {
      integration = {
        id: generateId(),
        organization_id: orgId,
        provider: 'instagram',
        app_id: instagramClient.getAppId(),
        app_name: 'CRM Executive-IG',
        account_id: accountId,
        account_username: username,
        access_token: longLivedToken,
        token_expires_at: expiresAt,
        status: 'conectado',
        webhook_verified: true,
        webhook_url: `${baseUrl}/api/webhooks/instagram`,
        last_sync_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      db.integrations.push(integration);
    }

    dbManager.saveDb(db);
    dbManager.logAudit(
      orgId,
      'INSTAGRAM_CONECTADO',
      'integration',
      integration.id,
      `Cuenta de Instagram @${username} (ID: ${accountId}) conectada exitosamente mediante Instagram Login.`
    );

    return NextResponse.redirect(new URL('/configuracion/integraciones/instagram?success=conectado', request.url));
  } catch (err: any) {
    console.error('[Instagram Callback Error Fatal]', err);
    const errText = encodeURIComponent(err.message || 'Error procesando tokens de Instagram');
    return NextResponse.redirect(new URL(`/configuracion/integraciones/instagram?error=${errText}`, request.url));
  }
}
