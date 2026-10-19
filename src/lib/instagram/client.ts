import crypto from 'crypto';

const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';
const OAUTH_API_BASE = 'https://api.instagram.com/oauth';

export interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string[];
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos (aprox 60 días)
}

export interface InstagramUserProfile {
  user_id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  recipientId?: string;
  error?: string;
  code?: number;
  subcode?: number;
}

export class InstagramClient {
  private appId: string;
  private appSecret: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '1107212452239193';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
  }

  public getAppId(): string {
    return process.env.INSTAGRAM_APP_ID || this.appId;
  }

  public getAppSecret(): string {
    return process.env.INSTAGRAM_APP_SECRET || this.appSecret;
  }

  public hasAppSecret(): boolean {
    const secret = this.getAppSecret();
    return Boolean(secret && secret.trim().length > 0);
  }

  /**
   * Genera la URL oficial de Instagram Login OAuth 2.0
   * Scopes autorizados: instagram_business_basic, instagram_business_manage_messages
   */
  public getAuthorizationUrl(redirectUri: string, state: string): string {
    const scopes = ['instagram_business_basic', 'instagram_business_manage_messages'].join(',');
    const appId = this.getAppId();
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: state,
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Canjea el código de autorización por un token de corta duración
   */
  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<InstagramTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.getAppId());
    formData.append('client_secret', this.getAppSecret());
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const res = await fetch(`${OAUTH_API_BASE}/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();
    if (!res.ok || data.error_type || data.error_message) {
      const msg = data.error_message || data.error?.message || 'Error al canjear código de autorización';
      throw new Error(`[Instagram OAuth Error] ${msg}`);
    }

    return {
      access_token: data.access_token,
      user_id: String(data.user_id),
      permissions: data.permissions,
    };
  }

  /**
   * Canjea un token de corta duración por uno de larga duración (60 días)
   */
  public async exchangeForLongLivedToken(shortLivedToken: string): Promise<InstagramLongLivedTokenResponse> {
    const url = new URL('https://graph.instagram.com/access_token');
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('access_token', shortLivedToken);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data.error?.message || 'Error al canjear por token de larga duración';
      throw new Error(`[Instagram Graph Error] ${msg}`);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 5184000,
    };
  }

  /**
   * Refresca un token de larga duración vigente
   */
  public async refreshLongLivedToken(longLivedToken: string): Promise<InstagramLongLivedTokenResponse> {
    const url = new URL('https://graph.instagram.com/refresh_access_token');
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', longLivedToken);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(`Error al refrescar token de Instagram: ${data.error?.message}`);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 5184000,
    };
  }

  /**
   * Obtiene los datos del perfil de la cuenta profesional autenticada
   */
  public async getUserProfile(accessToken: string): Promise<InstagramUserProfile> {
    const url = new URL(`${GRAPH_API_BASE}/me`);
    url.searchParams.set('fields', 'user_id,username,name,profile_picture_url');
    url.searchParams.set('access_token', accessToken);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(`Error al obtener perfil de Instagram: ${data.error?.message}`);
    }

    return {
      user_id: String(data.user_id || data.id),
      username: data.username || 'usuario_instagram',
      name: data.name,
      profile_picture_url: data.profile_picture_url,
    };
  }

  /**
   * Envía un mensaje directo mediante la Instagram Send API oficial
   */
  public async sendMessage(
    recipientIgsid: string,
    text: string,
    accessToken: string
  ): Promise<SendMessageResult> {
    try {
      // 1. Detectar si es el contacto simulado de demostración inicial
      if (
        recipientIgsid === '17841400123456789' ||
        recipientIgsid.startsWith('mock_') ||
        recipientIgsid.startsWith('demo_')
      ) {
        return {
          success: false,
          error:
            'Este es un contacto simulado de prueba (ID: ' +
            recipientIgsid +
            '). Meta exige que un usuario real de Instagram escriba primero a @novaexa.ec para abrir una conversación legítima y poder responderle.',
          code: 400,
        };
      }

      // 2. Determinar endpoint y headers según el formato del token
      // Tokens nativos de Instagram inician con "IGAA..." o "IGA..." -> graph.instagram.com
      // Tokens de Facebook Graph API inician con "EAAT..." o "EAA..." -> graph.facebook.com
      const isFbToken = accessToken.startsWith('EAA');
      const endpoint = isFbToken
        ? 'https://graph.facebook.com/v21.0/me/messages'
        : `${GRAPH_API_BASE}/me/messages`;

      const body = {
        recipient: {
          id: recipientIgsid,
        },
        message: {
          text: text,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error('[Instagram Send API Error]', data.error);
        let errorMsg = data.error?.message || 'Error devuelto por la API de Meta';

        // Traducción e interpretación amigable de errores comunes de Meta
        if (
          data.error?.code === 190 ||
          errorMsg.includes('Cannot parse access token') ||
          errorMsg.includes('Session has expired')
        ) {
          if (isFbToken) {
            errorMsg =
              'El token de Facebook ingresado (EAA...) ha expirado o carece del permiso "instagram_manage_messages". Genere un token nativo de Instagram (IGAA...) o renueve su token con permisos de mensajería en Meta for Developers.';
          } else {
            errorMsg =
              'El token de Instagram ha expirado o no es válido (Código 190). Por favor renuévelo en Configuración > Integraciones.';
          }
        } else if (
          errorMsg.includes('Object with ID') &&
          errorMsg.includes('does not exist')
        ) {
          errorMsg =
            'El destinatario no existe en Instagram o no ha iniciado una conversación con @novaexa.ec en las últimas 24 horas.';
        }

        return {
          success: false,
          error: errorMsg,
          code: data.error?.code,
          subcode: data.error?.error_subcode,
        };
      }

      return {
        success: true,
        messageId: data.message_id,
        recipientId: data.recipient_id,
      };
    } catch (err: any) {
      console.error('[Instagram Send Network Error]', err);
      return {
        success: false,
        error: err.message || 'Error de conexión con servidores de Meta',
      };
    }
  }

  /**
   * Valida la firma criptográfica HMAC-SHA256 del webhook entrante
   */
  public verifyWebhookSignature(payloadRaw: string, signatureHeader: string | null): boolean {
    if (!this.appSecret || !signatureHeader) {
      // Si no hay app secret configurado en local, registrar advertencia
      return true;
    }

    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) {
      return false;
    }

    const expectedHash = crypto
      .createHmac('sha256', this.appSecret)
      .update(payloadRaw, 'utf-8')
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHash, 'hex'));
  }
}

export const instagramClient = new InstagramClient();
