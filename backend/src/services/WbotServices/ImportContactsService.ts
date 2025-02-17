import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import { isString, isArray } from "lodash";
import { QueryTypes } from "sequelize";
import db from "../../database"; // Importe a instância do Sequelize

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(null, companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts;

  try {
    const contactsString = await ShowBaileysService(wbot.id);
    phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
    return; // Encerra a execução se não conseguir obter os contatos
  }

  const phoneContactsList = isString(phoneContacts)
    ? JSON.parse(phoneContacts)
    : phoneContacts;

  if (!isArray(phoneContactsList)) {
    logger.error("Phone contacts list is not an array");
    return;
  }

  // Filtra contatos válidos
  const validContacts = phoneContactsList
    .filter(({ id }) => id !== "status@broadcast" && !id.includes("g.us"))
    .map(({ id, name, notify }) => ({
      number: id.replace(/\D/g, ""),
      name: name || notify,
      companyId,
    }));

  // Cria uma tabela temporária
  const tempTableName = `temp_contacts_${companyId}_${Date.now()}`;

  try {
    // Cria a tabela temporária
    await db.query(
      `CREATE TEMPORARY TABLE ${tempTableName} (
        number VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        companyId INT
      )`,
      { type: QueryTypes.RAW }
    );

    // Insere os contatos na tabela temporária
    await db.query(
      `INSERT INTO ${tempTableName} (number, name, companyId) VALUES ${validContacts
        .map(() => "(?, ?, ?)")
        .join(",")}`,
      {
        type: QueryTypes.INSERT,
        replacements: validContacts.flatMap(({ number, name, companyId }) => [
          number,
          name,
          companyId,
        ]),
      }
    );

    // Atualiza contatos existentes e insere novos contatos
    await db.query(
      `INSERT INTO Contacts (number, name, companyId)
       SELECT number, name, companyId FROM ${tempTableName}
       ON CONFLICT (number) DO UPDATE
       SET name = EXCLUDED.name`,
      { type: QueryTypes.INSERT }
    );

    // Remove a tabela temporária
    await db.query(`DROP TABLE ${tempTableName}`, { type: QueryTypes.RAW });
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error processing contacts: ${err}`);
    // Remove a tabela temporária em caso de erro
    await db.query(`DROP TABLE IF EXISTS ${tempTableName}`, {
      type: QueryTypes.RAW,
    });
  }
};

export default ImportContactsService;