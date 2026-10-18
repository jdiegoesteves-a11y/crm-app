'use server';

import { revalidatePath } from 'next/cache';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { instagramClient } from '@/lib/instagram/client';
import { ChatMessage, ConversationStatus } from '@/types/database';

export async function sendChatMessageAction(
  conversationId: string,
  content: string,
  isInternalNote: boolean = false
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura: no puede enviar mensajes' };

    if (!content || !content.trim()) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }

    const db = await dbManager.getDb();
    const conv = db.conversations.find(
      (c) => c.id === conversationId && c.organization_id === session.organization_id
    );

    if (!conv) {
      return { success: false, error: 'Conversación no encontrada' };
    }

    const now = new Date();

    // 1. Caso: Nota interna privada entre asesores
    if (isInternalNote) {
      const internalMsg: ChatMessage = {
        id: generateId(),
        conversation_id: conv.id,
        organization_id: session.organization_id,
        sender_type: 'agent',
        sender_id: session.id,
        sender_name: session.full_name,
        content: content.trim(),
        media_type: 'none',
        status: 'enviado',
        is_internal_note: true,
        created_at: now.toISOString(),
      };

      db.messages.push(internalMsg);
      await dbManager.saveDb(db);
      revalidatePath('/mensajes');

      return { success: true, message: internalMsg };
    }

    // 2. Caso: Mensaje saliente al cliente por Instagram
    if (conv.channel === 'instagram') {
      // Verificación de la ventana de 24 horas de Meta
      if (conv.window_expires_at && new Date(conv.window_expires_at) < now) {
        return {
          success: false,
          error:
            'La ventana estándar de 24 horas de Meta ha expirado. Por políticas de privacidad de Instagram, el cliente debe enviar un nuevo mensaje para que pueda responderle.',
          isWindowExpired: true,
        };
      }

      // Buscar credenciales de la integración de Instagram
      const integration = db.integrations.find(
        (i) => i.organization_id === session.organization_id && i.provider === 'instagram'
      );

      if (!integration || !integration.access_token || integration.status !== 'conectado') {
        return {
          success: false,
          error: 'No hay una cuenta de Instagram conectada y activa en Configuración > Integraciones.',
        };
      }

      // Despacho a través de la Instagram Send API oficial
      const sendResult = await instagramClient.sendMessage(
        conv.contact_external_id,
        content.trim(),
        integration.access_token
      );

      if (!sendResult.success) {
        // Registrar mensaje fallido con detalles del error devueltos por Meta
        const failedMsg: ChatMessage = {
          id: generateId(),
          conversation_id: conv.id,
          organization_id: session.organization_id,
          sender_type: 'agent',
          sender_id: session.id,
          sender_name: session.full_name,
          content: content.trim(),
          media_type: 'none',
          status: 'fallido',
          error_details: sendResult.error,
          is_internal_note: false,
          created_at: now.toISOString(),
        };

        db.messages.push(failedMsg);
        await dbManager.saveDb(db);
        revalidatePath('/mensajes');

        return {
          success: false,
          error: `Error de Meta API: ${sendResult.error || 'No se pudo entregar el mensaje a Instagram'}`,
          message: failedMsg,
        };
      }

      // Mensaje confirmado y entregado a Instagram
      const sentMsg: ChatMessage = {
        id: generateId(),
        conversation_id: conv.id,
        organization_id: session.organization_id,
        external_id: sendResult.messageId,
        sender_type: 'agent',
        sender_id: session.id,
        sender_name: session.full_name,
        content: content.trim(),
        media_type: 'none',
        status: 'enviado',
        is_internal_note: false,
        created_at: now.toISOString(),
      };

      db.messages.push(sentMsg);

      // Actualizar conversación
      conv.last_message_text = `Tú: ${content.trim()}`;
      conv.last_message_at = now.toISOString();
      if (conv.status === 'sin_asignar') {
        conv.status = 'en_atencion';
        conv.assigned_to = session.id;
      }
      conv.updated_at = now.toISOString();

      await dbManager.saveDb(db);

      await dbManager.logAudit(
        session.organization_id,
        'INSTAGRAM_MENSAJE_ENVIADO',
        'conversation',
        conv.id,
        `Mensaje enviado a Instagram @${conv.contact_username || conv.contact_external_id} por ${session.email}`,
        { id: session.id, email: session.email }
      );

      revalidatePath('/mensajes');
      return { success: true, message: sentMsg };
    }

    return { success: false, error: 'Canal no soportado' };
  } catch (error: any) {
    console.error('Error al enviar mensaje:', error);
    return { success: false, error: error.message || 'Error interno del servidor' };
  }
}

export async function assignConversationAction(conversationId: string, agentId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = await dbManager.getDb();
    const conv = db.conversations.find(
      (c) => c.id === conversationId && c.organization_id === session.organization_id
    );

    if (!conv) return { success: false, error: 'Conversación no encontrada' };

    const agent = db.profiles.find((p) => p.id === agentId);
    conv.assigned_to = agentId;
    if (conv.status === 'sin_asignar') {
      conv.status = 'en_atencion';
    }
    conv.updated_at = new Date().toISOString();

    await dbManager.saveDb(db);

    await dbManager.logAudit(
      session.organization_id,
      'TRANSFERIR_CONVERSACION',
      'conversation',
      conv.id,
      `Conversación transferida a ${agent?.full_name || agentId} por ${session.email}`
    );

    revalidatePath('/mensajes');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al asignar asesor' };
  }
}

export async function updateConversationStatusAction(conversationId: string, newStatus: ConversationStatus) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = await dbManager.getDb();
    const conv = db.conversations.find(
      (c) => c.id === conversationId && c.organization_id === session.organization_id
    );

    if (!conv) return { success: false, error: 'Conversación no encontrada' };

    conv.status = newStatus;
    conv.updated_at = new Date().toISOString();

    await dbManager.saveDb(db);
    revalidatePath('/mensajes');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al cambiar estado' };
  }
}

export async function linkConversationToClientAction(conversationId: string, clientId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (session.role === 'consulta') return { success: false, error: 'Acceso de solo lectura' };

    const db = await dbManager.getDb();
    const conv = db.conversations.find(
      (c) => c.id === conversationId && c.organization_id === session.organization_id
    );
    if (!conv) return { success: false, error: 'Conversación no encontrada' };

    const client = db.clients.find((c) => c.id === clientId && c.organization_id === session.organization_id);
    if (!client) return { success: false, error: 'Cliente no encontrado' };

    conv.client_id = clientId;
    conv.contact_name = client.name;
    conv.updated_at = new Date().toISOString();

    await dbManager.saveDb(db);

    await dbManager.logAudit(
      session.organization_id,
      'VINCULAR_CONVERSACION_CLIENTE',
      'conversation',
      conv.id,
      `Conversación de Instagram vinculada formalmente al cliente [${client.name}] por ${session.email}`
    );

    revalidatePath('/mensajes');
    revalidatePath(`/clientes/${clientId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Error al vincular cliente' };
  }
}

export async function disconnectInstagramAction() {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores pueden desconectar integraciones' };
    }

    const db = await dbManager.getDb();
    const integration = db.integrations.find(
      (i) => i.organization_id === session.organization_id && i.provider === 'instagram'
    );

    if (!integration) return { success: false, error: 'Integración no encontrada' };

    integration.status = 'desconectado';
    integration.access_token = undefined;
    integration.updated_at = new Date().toISOString();

    await dbManager.saveDb(db);

    await dbManager.logAudit(
      session.organization_id,
      'INSTAGRAM_DESCONECTADO',
      'integration',
      integration.id,
      `Integración con Instagram desconectada por ${session.email}`
    );

    revalidatePath('/configuracion/integraciones/instagram');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al desconectar' };
  }
}

export async function manualSaveInstagramTokenAction(accessToken: string, username: string, userId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores pueden configurar credenciales' };
    }

    if (!accessToken.trim()) {
      return { success: false, error: 'El access token es requerido' };
    }

    const db = await dbManager.getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 86400 * 1000).toISOString();

    let integration = db.integrations.find(
      (i) => i.organization_id === session.organization_id && i.provider === 'instagram'
    );

    if (integration) {
      integration.access_token = accessToken.trim();
      integration.account_username = username.trim() || integration.account_username || 'cuenta_profesional';
      integration.account_id = userId.trim() || integration.account_id || '110721452239193';
      integration.status = 'conectado';
      integration.token_expires_at = expiresAt;
      integration.webhook_verified = true;
      integration.last_sync_at = now.toISOString();
      integration.last_error = undefined;
      integration.updated_at = now.toISOString();
    } else {
      const defaultAppId = process.env.INSTAGRAM_APP_ID || '1107212452239193';
      integration = {
        id: generateId(),
        organization_id: session.organization_id,
        provider: 'instagram',
        app_id: defaultAppId,
        app_name: 'CRM Executive-IG',
        account_id: userId.trim() || defaultAppId,
        account_username: username.trim() || 'cuenta_profesional',
        access_token: accessToken.trim(),
        token_expires_at: expiresAt,
        status: 'conectado',
        webhook_verified: true,
        last_sync_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      db.integrations.push(integration);
    }

    await dbManager.saveDb(db);

    await dbManager.logAudit(
      session.organization_id,
      'INSTAGRAM_TOKEN_MANUAL_CONFIGURADO',
      'integration',
      integration.id,
      `Token de Instagram configurado manualmente por ${session.email}`
    );

    revalidatePath('/configuracion/integraciones/instagram');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al guardar credenciales' };
  }
}
