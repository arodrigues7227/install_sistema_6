import Notifications from "../../models/Notifications";
import AppError from "../../errors/AppError";

const DeleteService = async (userId: number): Promise<void> => {
  const notifications = await Notifications.findAll({
    where: { userId }
  });

  if (!notifications) {
    throw new AppError("ERR_NO_HOLIDAYS_FOUND", 404);
  }

  await Promise.all(notifications.map(notification => notification.destroy()));
};

export default DeleteService;
