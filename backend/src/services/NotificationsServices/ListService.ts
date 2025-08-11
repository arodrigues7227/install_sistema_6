import { Op } from "sequelize";
import Notifications from "../../models/Notifications";


interface Response {
  notifications: Notifications[];
  count: number;
  hasMore: boolean;
}

interface Request {
    browserId: string;
    userId: number;
}

const ListService = async ({
  browserId,
  userId
}: { browserId?: string; userId: number }): Promise<Response> => {
  let whereCondition: any = {
    userId: { [Op.eq]: userId }
  };

  if (browserId) {
    whereCondition.browserId = { [Op.eq]: String(browserId) };
  }

  const { count, rows: notifications } = await Notifications.findAndCountAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
  });

  const hasMore = count > notifications.length;

  return {
    notifications,
    count,
    hasMore
  };
};

export default ListService;
