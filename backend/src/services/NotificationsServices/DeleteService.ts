import Notifications from "../../models/Notifications";
import AppError from "../../errors/AppError";

const DeleteService = async (userId: number): Promise<void> => {
  const notifications = await Notifications.findAll({
    where: { userId }
  });

  if (!notifications || notifications.length === 0) {
    throw new AppError("ERR_NO_NOTIFICATIONS_FOUND", 404);
  }

  await Promise.all(notifications.map(notification => notification.destroy()));
};

export default DeleteService;