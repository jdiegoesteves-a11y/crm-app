import { NextRequest, NextResponse } from 'next/server';
import { dbManager, generateId } from '@/lib/db';
import { instagramClient } from '@/lib/instagram/client';
import { ChatMessage, Conversation, Lead } from '@/types/database';

export const dynamic = 'force-dynamic';

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'crm_executive_ig_verify_token_2026_secure';

/**
 * GET: Verificación del Webhook por parte de Meta
 * Meta envía hub.mode, hub.verify_token y hub.challenge
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Instagram Webhook] Verificación oficial de Meta completada con éxito.');
    return new Response(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Instagram Webhook] Intento de verificación fallido o token no coincidente.', { mode, token });
  return new NextResponse('Verificación rechazada: Token inválido', { status: 403 });
}

/**
 * POST: Recepción de eventos de mensajería directa en tiempo real
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Validación de firma HMAC si la clave secreta está presente
    if (!instagramClient.verifyWebhookSignature(rawBody, signature)) {
      console.error('[Instagram Webhook] Firma HMAC-SHA256 no válida.');
      return new NextResponse('Firma inválida', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.object !== 'instagram' && payload.object !== 'page') {
      return NextResponse.json({ status: 'IGNORED_OBJECT' }, { status: 200 });
    }

    const db = await dbManager.getDb();
    const defaultOrg = db.organizations[0];
    const orgId = defaultOrg?.id || 'org-acme-001';
    const now = new Date();
    const windowExpiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

    let processedCount = 0;

    for (const entry of payload.entry || []) {
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        const senderId = event.sender?.id;
        const recipientId = event.recipient?.id;
        const message = event.message;

        // Solo procesamos mensajes de texto o multimedia entrantes
        if (!message || !senderId) continue;

        const messageMid = message.mid;

        // 1. Deduplicación e Idempotencia (Evitar mensajes duplicados de reintentos de Meta)
        if (messageMid && db.messages.some((m) => m.external_id === messageMid)) {
          console.log(`[Instagram Webhook] Mensaje duplicado omitido (mid: ${messageMid})`);
          continue;
        }

        // 2. Buscar o crear conversación
        let conv = db.conversations.find(
          (c) => c.organization_id === orgId && c.channel === 'instagram' && c.contact_external_id === senderId
        );

        if (!conv) {
          const convId = generateId();
          const defaultAgent = db.profiles.find((p) => p.role === 'vendedor' || p.role === 'gerente');

          // 3. Crear automáticamente Prospecto (Lead) vinculado a la identidad de Instagram
          let leadId: string | undefined;
          const existingLead = db.leads.find(
            (l) => l.organization_id === orgId && l.notes?.includes(`[IGSID:${senderId}]`)
          );

          if (existingLead) {
            leadId = existingLead.id;
          } else {
            const newLeadId = generateId();
            const newLead: Lead = {
              id: newLeadId,
              organization_id: orgId,
              assigned_to: defaultAgent?.id || 'usr-003',
              first_name: 'Contacto',
              last_name: `Instagram (${senderId.slice(-4)})`,
              company_name: 'Instagram Direct',
              email: `ig-${senderId.slice(-6)}@instagram.crm`,
              phone: '',
              source: 'instagram',
              interest: 'Mensaje Directo por Instagram',
              status: 'nuevo',
              priority: 'media',
              estimated_value: 0,
              notes: `[IGSID:${senderId}] Primer contacto recibido vía Instagram DM el ${now.toISOString()}`,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            };
            db.leads.unshift(newLead);
            leadId = newLeadId;
          }

          conv = {
            id: convId,
            organization_id: orgId,
            channel: 'instagram',
            external_id: `ig-thread-${senderId}`,
            contact_external_id: senderId,
            contact_name: `Usuario Instagram (${senderId.slice(-4)})`,
            contact_username: `user_${senderId.slice(-6)}`,
            lead_id: leadId,
            assigned_to: defaultAgent?.id,
            status: 'sin_asignar',
            last_message_text: message.text || '[Archivo multimedia]',
            last_message_at: now.toISOString(),
            unread_count: 1,
            window_expires_at: windowExpiresAt,
            tags: ['Nuevo', 'Instagram'],
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          };

          db.conversations.unshift(conv);
        } else {
          // Actualizar conversación existente
          conv.last_message_text = message.text || '[Archivo multimedia]';
          conv.last_message_at = now.toISOString();
          conv.unread_count = (conv.unread_count || 0) + 1;
          conv.window_expires_at = windowExpiresAt; // Renueva ventana de 24 horas
          if (conv.status === 'resuelta') {
            conv.status = 'pendiente';
          }
          conv.updated_at = now.toISOString();
        }

        // 4. Registrar mensaje en el historial del CRM
        let mediaUrl: string | undefined;
        let mediaType: any = 'none';

        if (message.attachments && message.attachments.length > 0) {
          const att = message.attachments[0];
          mediaUrl = att.payload?.url;
          mediaType = att.type || 'image';
        }

        const chatMsg: ChatMessage = {
          id: generateId(),
          conversation_id: conv.id,
          organization_id: orgId,
          external_id: messageMid,
          sender_type: 'contact',
          sender_id: senderId,
          sender_name: conv.contact_name || 'Contacto Instagram',
          content: message.text || (mediaType !== 'none' ? `[Adjunto: ${mediaType}]` : '[Mensaje recibido]'),
          media_url: mediaUrl,
          media_type: mediaType,
          status: 'entregado',
          is_internal_note: false,
          created_at: now.toISOString(),
        };

        db.messages.push(chatMsg);
        processedCount++;
      }
    }

    if (processedCount > 0) {
      await dbManager.saveDb(db);
      await dbManager.logAudit(
        orgId,
        'INSTAGRAM_MENSAJE_RECIBIDO',
        'conversation',
        'webhook',
        `Se procesaron ${processedCount} mensajes entrantes de Instagram Direct de forma segura.`
      );
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED', processed: processedCount }, { status: 200 });
  } catch (err: any) {
    console.error('[Instagram Webhook Processing Error]', err);
    return NextResponse.json({ error: 'Error interno en procesamiento' }, { status: 500 });
  }
}
