import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";

interface WhatsAppContact {
  id: string;
  name?: string;
  notify?: string;
  imgUrl?: string;
}

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(null, companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts: WhatsAppContact[];

  try {
    // Obtém os contatos do WhatsApp através do Baileys
    const contactsString = await ShowBaileysService(wbot.id);
    phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));

    for (let contact of phoneContacts) {
      if (!contact.id || contact.id === "status@broadcast") continue;

      try {
        const number = contact.id.replace(/\D/g, "");

        // Obtém a foto do perfil
        let profilePicUrl: string;
        try {
          profilePicUrl = await wbot.profilePictureUrl(contact.id);
        } catch (error) {
          logger.warn(`Could not get profile picture for ${contact.id}`);
          profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
        }

        const contactData = {
          name: contact.name || contact.notify || number,
          number,
          isGroup: contact.id.includes("@g.us"),
          companyId,
          profilePicUrl,
          remoteJid: contact.id,
          whatsappId: wbot.id,
          wbot
        };

        await CreateOrUpdateContactService(contactData);
      } catch (error) {
        logger.error(`Error importing contact ${contact.id}: ${error.message}`);
        Sentry.captureException(error);
        continue;
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
  }
};

export default ImportContactsService;