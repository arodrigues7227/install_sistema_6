import { getIO } from "../../libs/socket";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import fs from "fs";
import path, { join } from "path";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import * as Sentry from "@sentry/node";
import sequelize from "../../database";

const axios = require('axios');

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  whatsappId?: number;
  wbot?: any;
  birthDate?: Date | string;
}

const downloadProfileImage = async ({
  profilePicUrl,
  companyId,
  contact
}) => {
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  let filename;

  const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    fs.chmodSync(folder, 0o777);
  }

  try {
    const response = await axios.get(profilePicUrl, {
      responseType: 'arraybuffer'
    });

    filename = `${new Date().getTime()}.jpeg`;
    fs.writeFileSync(join(folder, filename), response.data);
  } catch (error) {
    console.error(error);
  }

  return filename;
};

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  whatsappId,
  wbot,
  birthDate = null
}: Request): Promise<Contact> => {
  const transaction = await sequelize.transaction();
  
  try {
    const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9-]/g, "");
    const io = getIO();
    
    // Verificar se existe um contato (inclusive os excluídos logicamente)
    let contact = await Contact.findOne({
      where: { number, companyId },
      paranoid: false, // Buscar mesmo os marcados como excluídos
      transaction
    });

    if (contact && contact.deletedAt) {
      // Se existe e está marcado como excluído, restaurar o registro
      await contact.restore({ transaction });
      logger.info(`Restaurando contato previamente excluído: ${number}`);
    }

    let updateImage = true;

    if (contact) {
      contact.remoteJid = remoteJid;
      contact.profilePicUrl = profilePicUrl || null;
      contact.isGroup = isGroup;
      
      if (isNil(contact.whatsappId)) {
        const whatsapp = await Whatsapp.findOne({
          where: { id: whatsappId, companyId },
          transaction
        });

        console.log(104, "CreateUpdateContactService");

        if (whatsapp) {
          contact.whatsappId = whatsappId;
        }
      }
      
      const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
      const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

      let fileName, oldPath = "";
      if (contact.urlPicture) {
        oldPath = path.resolve(contact.urlPicture.replace(/\\/g, '/'));
        fileName = path.join(folder, oldPath.split('\\').pop());
      }
      
      if (!fs.existsSync(fileName) || contact.profilePicUrl === "") {
        if (wbot && ['whatsapp'].includes(channel)) {
          try {
            profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
          } catch (e) {
            Sentry.captureException(e);
            profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
          }
          contact.profilePicUrl = profilePicUrl;
          updateImage = true;
        }
      }

      if (contact.name === number) {
        contact.name = name;
      }

      await contact.save({ transaction });
      await contact.reload({ transaction });
      
    } else if (wbot && ['whatsapp'].includes(channel)) {
      const settings = await CompaniesSettings.findOne({ 
        where: { companyId },
        transaction
      });
      
      const { acceptAudioMessageContact } = settings || {};
      let newRemoteJid = remoteJid;

      if (!remoteJid && remoteJid !== "") {
        newRemoteJid = isGroup ? `${rawNumber}@g.us` : `${rawNumber}@s.whatsapp.net`;
      }
      
      try {
        profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
      } catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      contact = await Contact.create({
        name,
        number,
        email,
        birthDate,
        isGroup,
        companyId,
        channel,
        acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false,
        remoteJid: newRemoteJid,
        profilePicUrl,
        urlPicture: "",
        whatsappId
      }, { transaction });

    } else if (['facebook', 'instagram'].includes(channel)) {
      contact = await Contact.create({
        name,
        number,
        email,
        isGroup,
        companyId,
        channel,
        profilePicUrl,
        urlPicture: "",
        whatsappId
      }, { transaction });
    }

    if (updateImage) {
      let filename;

      filename = await downloadProfileImage({
        profilePicUrl,
        companyId,
        contact
      });

      await contact.update({
        urlPicture: filename,
        pictureUpdated: true
      }, { transaction });

      await contact.reload({ transaction });
    } else {
      if (['facebook', 'instagram'].includes(channel)) {
        let filename;

        filename = await downloadProfileImage({
          profilePicUrl,
          companyId,
          contact
        });

        await contact.update({
          urlPicture: filename,
          pictureUpdated: true
        }, { transaction });

        await contact.reload({ transaction });
      }
    }

    await transaction.commit();

    // Emitir o evento apropriado
    if (!contact.id) {
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "create",
          contact
        });
    } else {
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "update",
          contact
        });
    }

    return contact;
  } catch (err) {
    await transaction.rollback();
    logger.error("Error to find or create a contact:", err);
    throw err;
  }
};

export default CreateOrUpdateContactService;