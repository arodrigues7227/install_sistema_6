import { FindOptions } from "sequelize/types";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  session?: number | string;
}

const ListAllWhatsAppsService = async ({
  session,
}: Request): Promise<Whatsapp[]> => {
  const options: FindOptions = {
        attributes: [
      "id",
      "name",
      "channel",
      "status",
      "qrcode",
      "isDefault",
      "updatedAt"
    ],
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      }
    ]
  };
  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListAllWhatsAppsService;
