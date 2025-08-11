import CreateService from "../services/NotificationsServices/CreateService"
import ListService from "../services/NotificationsServices/ListService"
import DeleteService from "../services/NotificationsServices/DeleteService"
import { Request, Response } from "express";
import webpush from "web-push";
import { logger } from "../utils/logger";


webpush.setVapidDetails(
  process.env.SUBJECT || "",
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
  const { title, message, userId, vibrate, actions, url, icon } = req.body;
  const str = JSON.stringify({ title: title, body: message, vibrate: vibrate, actions: actions, url: url, icon: icon, badge: icon });
  const { notifications, count } =  await ListService({
    userId: userId
  });
  
  const filteredBrowserData = notifications
  .map(n => n.browserData as unknown as BrowserData)
  .filter((browserData): browserData is BrowserData => !!browserData);

  for (const { id, pushSubscription } of filteredBrowserData) {
    logger.info(`Enviando notificacao para ${id}`);

    try {
      await webpush.sendNotification(pushSubscription, str);
      logger.info(`Notificacao enviada para ${id}`);
    } catch (ex) {
      logger.error(`Erro ao enviar notificacao para ${id}:`, ex.message);
      await DeleteService(userId);
    }
  }
  
  return res.status(200).json({ message: "Notifications processed" });;
};

export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { browserId, userId, pushSubscription } = req.body;
  const BrowserData = { id: browserId, pushSubscription }
  const { count } =  await ListService({
    browserId: browserId,
    userId: userId
  });
  if (count==0){
    const Notifications = await CreateService({
      userId: userId,
      browserId: browserId,
      browserData: BrowserData
    });
  }

  return res.status(200).json({ ok: true, count: count });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { browserId, userId } = req.body;

  const { count } =  await ListService({
    browserId: browserId,
    userId: userId
  });

  return res.status(200).json({ ok: true, count: count });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = Number(req.params.userId);

  await DeleteService(userId);

  return res.status(200).json({ message: "Notifications deleted" });
};