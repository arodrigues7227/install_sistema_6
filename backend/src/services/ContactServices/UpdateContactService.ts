import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import ContactWallet from "../../models/ContactWallet";
import User from "../../models/User";
import UsersContacts from "../../models/UsersContacts";
import sequelize from "../../database";
import logger from "../../utils/logger";
import Sequelize from "sequelize";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}
interface Wallet {
  walletId: number | string;
  contactId: number | string;
  companyId: number | string;
}

interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  remoteJid?: string;
  wallets?: null | number[] | string[];
  users?: User[];
  birthDate?: Date | string;
}

interface Request {
  contactData: ContactData;
  contactId: string;
  companyId: number;
}

const UpdateContactService = async ({
  contactData,
  contactId,
  companyId
}: Request): Promise<Contact> => {
  const { email, name, number, extraInfo, acceptAudioMessage, birthDate, active, disableBot, remoteJid, wallets, users } = contactData;
  const transaction = await sequelize.transaction();

  try {
    const contact = await Contact.findOne({
      where: { id: contactId },
      attributes: ["id", "name", "number", "channel", "email", "companyId", "acceptAudioMessage", "active", "profilePicUrl", "remoteJid", "urlPicture", "isGroup", "deletedAt", "birthDate"],
      include: ["extraInfo", "tags", "users",
        {
          association: "wallets",
          attributes: ["id", "name"]
        }],
      paranoid: false,
      transaction
    });

    if (!contact) {
      throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }

    if (contact?.companyId !== companyId) {
      throw new AppError("Não é possível alterar registros de outra empresa");
    }

    // Se o contato estiver excluído logicamente, restaura-o
    if (contact.deletedAt) {
      await contact.restore({ transaction });
      logger.info(`Restaurando contato excluído durante atualização: ${contact.number}`);
    }

    // Verifica se o número está sendo alterado
    if (number && number !== contact.number) {
      // Verifica se já existe outro contato com o novo número (incluindo os excluídos)
      const existingContact = await Contact.findOne({
        where: { 
          number,
          companyId,
          id: { [Sequelize.Op.ne]: contactId } // Não incluir o contato atual
        },
        paranoid: false,
        transaction
      });

      if (existingContact) {
        if (existingContact.deletedAt) {
          // Se existe e está excluído, exclui permanentemente para permitir a reutilização do número
          await existingContact.destroy({ force: true, transaction });
          logger.info(`Excluindo permanentemente contato para permitir atualização: ${existingContact.number}`);
        } else {
          throw new AppError("Já existe um contato com este número");
        }
      }
    }

    if (extraInfo) {
      await Promise.all(
        extraInfo.map(async (info: any) => {
          await ContactCustomField.upsert({ ...info, contactId: contact.id }, { transaction });
        })
      );

      await Promise.all(
        contact.extraInfo.map(async oldInfo => {
          const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

          if (stillExists === -1) {
            await ContactCustomField.destroy({ where: { id: oldInfo.id }, transaction });
          }
        })
      );
    }

    if (wallets) {
      await ContactWallet.destroy({
        where: {
          companyId,
          contactId
        },
        transaction
      });

      const contactWallets: Wallet[] = [];
      wallets.forEach((wallet: any) => {
        contactWallets.push({
          walletId: !wallet.id ? wallet : wallet.id,
          contactId,
          companyId
        });
      });

      await ContactWallet.bulkCreate(contactWallets, { transaction });
    }

    // PERMISSOES DE USUARIO NO GRUPO
    if (users && contact.isGroup) {
      try {
        // Remover associações existentes
        await UsersContacts.destroy({ 
          where: { contactId: contact.id },
          transaction
        });

        // Adicionar novas associações
        for (const user of users) {
          // Verificar se o usuário existe
          const userExists = await User.findByPk(user.id, { transaction });

          if (!userExists) {
            throw new AppError(`Usuário com ID ${user.id} não encontrado`, 404);
          }

          await UsersContacts.create({
            contactId: contact.id,
            userId: user.id
          }, { transaction });
        }
      } catch (error) {
        throw new AppError(`Erro ao atualizar usuários do contato: ${error.message}`, 500);
      }
    }

    // Atualiza os dados básicos do contato
    await contact.update({
      name,
      number,
      email,
      birthDate,
      acceptAudioMessage,
      active,
      disableBot,
      remoteJid
    }, { transaction });

    // Recarrega o contato com seus relacionamentos
    await contact.reload({
      attributes: ["id", "name", "number", "birthDate", "channel", "email", "companyId", "acceptAudioMessage", "active", "profilePicUrl", "remoteJid", "urlPicture", "isGroup"],
      include: ["extraInfo", "tags", "users",
        {
          association: "wallets", 
          attributes: ["id", "name"]
        }],
      transaction
    });

    await transaction.commit();
    return contact;
  } catch (error) {
    await transaction.rollback();
    logger.error(`Erro ao atualizar contato: ${error.message}`);
    throw error;
  }
};

export default UpdateContactService;