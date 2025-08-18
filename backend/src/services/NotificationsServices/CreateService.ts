import Notifications from "../../models/Notifications";

interface PushSubscription {
  endpoint: string;
  expirationTime: null | string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface BrowserData {
  id: string;
  pushSubscription: PushSubscription;
}

interface Request {
  userId: number;
  browserId: string;
  browserData: BrowserData;
}

const CreateService = async ({
  userId,
  browserId,
  browserData,
}: Request): Promise<Notifications> => {

  const notifications = await Notifications.create(
    {
      userId,
      browserId,
      browserData,
    }
  );

  await notifications.reload();
  return notifications;
};

export default CreateService;