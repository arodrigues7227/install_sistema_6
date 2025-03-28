import { head } from "lodash";
import XLSX from "xlsx";
import { has } from "lodash";
import ContactListItem from "../../models/ContactListItem";
import CheckContactNumber from "../WbotServices/CheckNumber";
import logger from "../../utils/logger";
import Contact from "../../models/Contact";
import sequelize from "../../database";

export async function ImportContactsService(
  companyId: number,
  file: Express.Multer.File | undefined
) {
  const workbook = XLSX.readFile(file?.path as string);
  const worksheet = head(Object.values(workbook.Sheets)) as any;
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 });

  const contacts = rows.map(row => {
    let name = "";
    let number = "";
    let email = "";

    if (has(row, "nome") || has(row, "Nome")) {
      name = row["nome"] || row["Nome"];
    }

    if (
      has(row, "numero") ||
      has(row, "número") ||
      has(row, "Numero") ||
      has(row, "Número")
    ) {
      number = row["numero"] || row["número"] || row["Numero"] || row["Número"];
      number = `${number}`.replace(/\D/g, "");
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row["email"] || row["e-mail"] || row["Email"] || row["E-mail"];
    }

    return { name, number, email, companyId };
  });

  const contactList: Contact[] = [];
  const transaction = await sequelize.transaction();

  try {
    for (const contact of contacts) {
      try {
        // Busca o contato, incluindo os excluídos logicamente
        const existingContact = await Contact.findOne({
          where: {
            number: `${contact.number}`,
            companyId: contact.companyId
          },
          paranoid: false,
          transaction
        });

        if (existingContact) {
          // Se estiver excluído, restaura
          if (existingContact.deletedAt) {
            await existingContact.restore({ transaction });
            logger.info(`Restaurando contato excluído na importação: ${contact.number}`);
            contactList.push(existingContact);
          }
          // Se já existe e não está excluído, não faz nada
        } else {
          // Cria um novo contato
          const newContact = await Contact.create(contact, { transaction });
          contactList.push(newContact);
        }
      } catch (error) {
        logger.error(`Erro ao processar contato na importação: ${contact.number}`, error);
      }
    }

    await transaction.commit();
    return contactList;
  } catch (error) {
    await transaction.rollback();
    logger.error("Erro na importação de contatos:", error);
    throw error;
  }
}

