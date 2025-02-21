import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import { isString, isArray } from "lodash";
import { QueryTypes } from "sequelize";
import db from "../../database";

interface WhatsAppContact {
  id: string;
  name?: string;
  notify?: string;
  imgUrl?: string;
}

const isValidPhoneNumber = (number: string): boolean => {
  // Remove todos os caracteres não numéricos
  const cleanNumber = number.replace(/\D/g, "");
  // Verifica se o número tem entre 10 e 14 dígitos
  return cleanNumber.length >= 10 && cleanNumber.length <= 14;
};

const sanitizeContactName = (name: string): string => {
  // Remove números e caracteres especiais do nome
  return name.replace(/[0-9!@#$%^&*(),.?":{}|<>]/g, "").trim();
};

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(null, companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts: WhatsAppContact[];

  try {
    const contactsString = await ShowBaileysService(wbot.id);
    phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));

    // Tenta obter as fotos de perfil
    const profilePictures = await Promise.allSettled(
      phoneContacts.map(async (contact) => {
        try {
          if (!contact.id) return null;
          const profilePic = await wbot.profilePictureUrl(contact.id);
          return { id: contact.id, imgUrl: profilePic };
        } catch (error) {
          return null;
        }
      })
    );

    // Associa as fotos de perfil aos contatos
    const pictureResults = profilePictures
      .filter((result): result is PromiseFulfilledResult<{ id: string; imgUrl: string } | null> => 
        result.status === "fulfilled" && result.value !== null
      )
      .map(result => result.value);

    phoneContacts = phoneContacts.map(contact => {
      const picture = pictureResults.find(pic => pic?.id === contact.id);
      return { ...contact, imgUrl: picture?.imgUrl };
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
    return;
  }

  const phoneContactsList = isString(phoneContacts)
    ? JSON.parse(phoneContacts)
    : phoneContacts;

  if (!isArray(phoneContactsList)) {
    logger.error("Phone contacts list is not an array");
    return;
  }

  // Filtra e valida os contatos
  const validContacts = phoneContactsList
    .filter(({ id }) => {
      const number = id.replace(/\D/g, "");
      return (
        id !== "status@broadcast" &&
        !id.includes("g.us") &&
        isValidPhoneNumber(number)
      );
    })
    .map(({ id, name, notify, imgUrl }) => ({
      number: id.replace(/\D/g, ""),
      name: sanitizeContactName(name || notify || ""),
      companyId,
      profilePicUrl: imgUrl || null
    }))
    .filter(contact => contact.name !== ""); // Remove contatos sem nome após sanitização

  if (validContacts.length === 0) {
    logger.info("No valid contacts found to import");
    return;
  }

  const tempTableName = `temp_contacts_${companyId}_${Date.now()}`;

  try {
    // Cria a tabela temporária com coluna para a foto de perfil
    await db.query(
      `CREATE TEMPORARY TABLE ${tempTableName} (
        number VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        companyId INT,
        profilePicUrl TEXT
      )`,
      { type: QueryTypes.RAW }
    );

    // Insere os contatos na tabela temporária em lotes de 100
    const batchSize = 100;
    for (let i = 0; i < validContacts.length; i += batchSize) {
      const batch = validContacts.slice(i, i + batchSize);
      await db.query(
        `INSERT INTO ${tempTableName} (number, name, companyId, profilePicUrl) VALUES ${batch
          .map(() => "(?, ?, ?, ?)")
          .join(",")}`,
        {
          type: QueryTypes.INSERT,
          replacements: batch.flatMap(({ number, name, companyId, profilePicUrl }) => [
            number,
            name,
            companyId,
            profilePicUrl
          ]),
        }
      );
    }

    // Atualiza contatos existentes e insere novos
    await db.query(
      `INSERT INTO "Contacts" (number, name, companyId, "profilePicUrl")
       SELECT number, name, companyId, profilePicUrl FROM ${tempTableName}
       ON CONFLICT (number, "companyId") DO UPDATE
       SET name = EXCLUDED.name,
           "profilePicUrl" = EXCLUDED.profilePicUrl
       WHERE "Contacts".name != EXCLUDED.name OR "Contacts"."profilePicUrl" IS DISTINCT FROM EXCLUDED.profilePicUrl`,
      { type: QueryTypes.INSERT }
    );

    logger.info(`Successfully imported ${validContacts.length} contacts`);
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error processing contacts: ${err}`);
  } finally {
    // Garante que a tabela temporária seja removida
    await db.query(`DROP TABLE IF EXISTS ${tempTableName}`, {
      type: QueryTypes.RAW,
    });
  }
};

export default ImportContactsService;