import CreateService from "../services/NotificationsServices/CreateService";
import ListService from "../services/NotificationsServices/ListService";
import DeleteService from "../services/NotificationsServices/DeleteService";
import { Request, Response } from "express";
import webpush from "web-push";
import logger from "../utils/logger";

webpush.setVapidDetails(
  process.env.SUBJECT || "mailto:admin@seusite.com",
  process.env.PUBLIC_KEY || "",
  process.env.PRIVATE_KEY || ""
);

interface BrowserData {
  id: string;
  pushSubscription: {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export const notifyAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { title, message, userId, vibrate, actions, url, icon } = req.body;
    
    // Validação básica
    if (!title || !message || !userId) {
      return res.status(400).json({ 
        error: "Título, mensagem e userId são obrigatórios" 
      });
    }
    
    // Configuração específica para iOS com payload otimizado
    const payload = JSON.stringify({ 
      title: String(title).substring(0, 100), // Limita tamanho do título
      body: String(message).substring(0, 200), // Limita tamanho da mensagem
      vibrate: vibrate || [200, 100, 200], 
      actions: actions || [], 
      url: url || "/", 
      icon: icon || "/favicon.ico", 
      badge: icon || "/favicon.ico",
      tag: `notification-${userId}-${Date.now()}`, // Tag única para evitar duplicatas
      requireInteraction: true, // CRÍTICO para iOS
      silent: false, // Para permitir áudio
      timestamp: Date.now(),
      renotify: true,
      data: {
        url: url || "/",
        userId: userId,
        timestamp: Date.now()
      }
    });

    const { notifications, count } = await ListService({
      userId: userId
    });
    
    if (count === 0) {
      return res.status(404).json({ 
        message: "Nenhuma subscription encontrada para este usuário" 
      });
    }
    
    const filteredBrowserData = notifications
      .map(n => n.browserData as unknown as BrowserData)
      .filter((browserData): browserData is BrowserData => 
        !!browserData && 
        !!browserData.pushSubscription &&
        !!browserData.pushSubscription.endpoint
      );

    if (filteredBrowserData.length === 0) {
      return res.status(404).json({ 
        message: "Nenhuma subscription válida encontrada" 
      });
    }

    const sendPromises = filteredBrowserData.map(async ({ id, pushSubscription }) => {
      logger.info(`Enviando notificação para ${id}`);

      try {
        // Configurações específicas para iOS/Safari
        const options = {
          TTL: 2419200, // 4 semanas (máximo permitido)
          urgency: 'high' as const, // CRÍTICO para iOS - prioridade alta
          headers: {
            'Topic': process.env.VAPID_SUBJECT || 'default-topic'
          },
          timeout: 30000 // 30 segundos de timeout
        };

        const result = await webpush.sendNotification(pushSubscription, payload, options);
        logger.info(`Notificação enviada com sucesso para ${id}. Status: ${result.statusCode}`);
        
        return { 
          success: true, 
          id, 
          statusCode: result.statusCode,
          headers: result.headers 
        };
        
      } catch (ex: any) {
        logger.error(`Erro ao enviar notificação para ${id}:`, {
          message: ex.message,
          statusCode: ex.statusCode,
          endpoint: pushSubscription.endpoint.substring(0, 50) + "..."
        });
        
        // Remove subscription apenas se erro for de subscription inválida
        if (ex.statusCode === 410 || ex.statusCode === 404 || ex.statusCode === 413) {
          logger.info(`Removendo subscription inválida para usuário ${userId}`);
          try {
            await DeleteService(userId);
          } catch (deleteError) {
            logger.error(`Erro ao remover subscription inválida:`, deleteError);
          }
        }
        
        return { 
          success: false, 
          id, 
          error: ex.message,
          statusCode: ex.statusCode 
        };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    
    const processedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { 
          success: false, 
          error: result.reason?.message || 'Erro desconhecido' 
        };
      }
    });
    
    const successCount = processedResults.filter(r => r.success).length;
    const errorCount = processedResults.length - successCount;
    
    logger.info(`Notificações processadas: ${successCount} sucessos, ${errorCount} erros`);
    
    return res.status(200).json({ 
      message: "Notificações processadas",
      summary: {
        total: processedResults.length,
        success: successCount,
        errors: errorCount
      },
      results: processedResults
    });
    
  } catch (error: any) {
    logger.error('Erro geral no processamento de notificações:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor ao processar notificações",
      message: error.message 
    });
  }
};

export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { browserId, userId, pushSubscription } = req.body;
    
    // Validação dos dados recebidos
    if (!browserId || !userId || !pushSubscription) {
      return res.status(400).json({ 
        error: "browserId, userId e pushSubscription são obrigatórios" 
      });
    }
    
    if (!pushSubscription.endpoint || !pushSubscription.keys) {
      return res.status(400).json({ 
        error: "pushSubscription deve conter endpoint e keys" 
      });
    }
    
    if (!pushSubscription.keys.p256dh || !pushSubscription.keys.auth) {
      return res.status(400).json({ 
        error: "pushSubscription.keys deve conter p256dh e auth" 
      });
    }
    
    const browserData = { 
      id: String(browserId), 
      pushSubscription: {
        endpoint: pushSubscription.endpoint,
        expirationTime: pushSubscription.expirationTime || null,
        keys: {
          p256dh: pushSubscription.keys.p256dh,
          auth: pushSubscription.keys.auth
        }
      }
    };
    
    const { count } = await ListService({
      browserId: String(browserId),
      userId: Number(userId)
    });
    
    if (count === 0) {
      const notification = await CreateService({
        userId: Number(userId),
        browserId: String(browserId),
        browserData: browserData
      });
      
      logger.info(`Nova subscription criada para usuário ${userId}, browser ${browserId}`);
      
      return res.status(201).json({ 
        ok: true, 
        count: 1,
        message: "Subscription criada com sucesso",
        id: notification.id
      });
    } else {
      logger.info(`Subscription já existe para usuário ${userId}, browser ${browserId}`);
      return res.status(200).json({ 
        ok: true, 
        count: count,
        message: "Subscription já existe"
      });
    }
    
  } catch (error: any) {
    logger.error('Erro ao armazenar subscription:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor ao armazenar subscription",
      message: error.message 
    });
  }
};

export const show = async (
  req: Request, 
  res: Response
): Promise<Response> => {
  try {
    const { browserId, userId } = req.body;
    
    if (!browserId || !userId) {
      return res.status(400).json({ 
        error: "browserId e userId são obrigatórios" 
      });
    }

    const { count, notifications } = await ListService({
      browserId: String(browserId),
      userId: Number(userId)
    });

    return res.status(200).json({ 
      ok: true, 
      count: count,
      hasSubscription: count > 0,
      subscriptions: notifications.map(n => ({
        id: n.id,
        browserId: n.browserId,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }))
    });
    
  } catch (error: any) {
    logger.error('Erro ao buscar subscriptions:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor ao buscar subscriptions",
      message: error.message 
    });
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = Number(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        error: "userId deve ser um número válido" 
      });
    }

    await DeleteService(userId);
    
    logger.info(`Subscriptions removidas para usuário ${userId}`);

    return res.status(200).json({ 
      message: "Subscriptions removidas com sucesso",
      userId: userId
    });
    
  } catch (error: any) {
    logger.error('Erro ao remover subscriptions:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor ao remover subscriptions",
      message: error.message 
    });
  }
};

// Nova função para testar notificação
export const test = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: "userId é obrigatório" 
      });
    }
    
    const testNotification = {
      title: "Teste de Notificação",
      message: "Esta é uma notificação de teste para verificar se está funcionando corretamente.",
      userId: userId,
      vibrate: [200, 100, 200],
      actions: [],
      url: "/",
      icon: "/favicon.ico"
    };
    
    // Reutiliza a lógica do notifyAll
    req.body = testNotification;
    return await notifyAll(req, res);
    
  } catch (error: any) {
    logger.error('Erro no teste de notificação:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor no teste",
      message: error.message 
    });
  }
};