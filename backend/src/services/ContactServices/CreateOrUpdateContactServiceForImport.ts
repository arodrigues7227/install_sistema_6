import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import sequelize from "../../database";
import logger from "../../utils/logger";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  commandBot?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
  companyId: number;
}

const CreateOrUpdateContactServiceForImport = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  commandBot = "",
  extraInfo = [], 
  companyId
}: Request): Promise<Contact> => {
  const transaction = await sequelize.transaction();
  
  try {
    const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
    const io = getIO();

    // Busca o contato, incluindo os excluídos logicamente
    let contact = await Contact.findOne({ 
      where: { number, companyId },
      paranoid: false,
      transaction
    });

    if (contact) {
      // Se o contato estiver excluído logicamente, restaura
      if (contact.deletedAt) {
        await contact.restore({ transaction });
        logger.info(`Restaurando contato excluído durante importação: ${number}`);
      }

      // Atualiza os dados
      await contact.update({ name, profilePicUrl }, { transaction });

      await transaction.commit();

      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "update",
          contact
        });
    } else {
      // Cria um novo contato
      contact = await Contact.create({
        name,
        companyId,
        number,
        profilePicUrl,
        email,
        commandBot,
        isGroup,
        extraInfo
      }, { transaction });

      await transaction.commit();

      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "create",
          contact
        });
    }

    return contact;
  } catch (error) {
    await transaction.rollback();
    
    // Se ocorrer erro de duplicidade, tenta recuperar o contato
    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.warn(`Erro de duplicidade ao importar contato: ${rawNumber}`);
      
      const existingContact = await Contact.findOne({
        where: { number: isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, ""), companyId },
        paranoid: false
      });
      
      if (existingContact) {
        if (existingContact.deletedAt) {
          await existingContact.restore();
          logger.info(`Restaurado contato que estava excluído logicamente: ${rawNumber}`);
        }
        return existingContact;
      }
    }
    
    logger.error(`Erro ao importar contato ${rawNumber}:`, error);
    throw error;
  }
};

export default CreateOrUpdateContactServiceForImport;