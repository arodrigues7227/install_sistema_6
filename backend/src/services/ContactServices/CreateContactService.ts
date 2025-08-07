import AppError from "../../errors/AppError";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import logger from "../../utils/logger";
import ContactWallet from "../../models/ContactWallet";
import sequelize from "../../database";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Wallet {
  walletId: number | string;
  contactId: number | string;
  companyId: number | string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  companyId: number;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  wallets?: null | number[] | string[];
  birthDate?: Date | string;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  profilePicUrl = "",
  acceptAudioMessage,
  active = true,
  companyId,
  extraInfo = [],
  remoteJid = "",
  wallets = null,
  birthDate = null
}: Request): Promise<Contact> => {
  const transaction = await sequelize.transaction();

  try {
    // Verifica se o contato já existe, incluindo os marcados como excluídos logicamente
    const existingContact = await Contact.findOne({
      where: { number, companyId },
      paranoid: false, // Busca inclusive os excluídos logicamente
      transaction,
      include: [
        "extraInfo",
        {
          association: "wallets",
          attributes: ["id", "name"]
        }
      ]
    });

    let processedBirthDate: Date | null = null;
    if (birthDate) {
      if (typeof birthDate === 'string') {
        processedBirthDate = new Date(birthDate);
        // Validar se a data é válida
        if (isNaN(processedBirthDate.getTime())) {
          throw new AppError("Data de nascimento inválida");
        }
      } else {
        processedBirthDate = birthDate;
      }
    }

    if (existingContact) {
      // Se o contato estiver excluído logicamente, restaura-o
      if (existingContact.deletedAt) {
        await existingContact.restore({ transaction });
        logger.info(`Restaurando contato previamente excluído: ${number}`);
      }

      // Atualiza o contato existente
      await existingContact.update(
        {
          name,
          email,
          birthDate: processedBirthDate,
          profilePicUrl,
          remoteJid,
          ...(acceptAudioMessage !== undefined && { acceptAudioMessage }),
          active
        },
        { transaction }
      );

      // Atualiza informações extras se fornecidas
      if (extraInfo && extraInfo.length > 0) {
        await ContactCustomField.destroy({
          where: { contactId: existingContact.id },
          transaction
        });

        const customFields = extraInfo.map((info) => ({
          ...info,
          contactId: existingContact.id,
          companyId
        }));

        await ContactCustomField.bulkCreate(customFields, { transaction });
      }

      // Atualiza carteiras se fornecidas
      if (wallets) {
        await ContactWallet.destroy({
          where: {
            companyId,
            contactId: existingContact.id
          },
          transaction
        });

        const contactWallets: Wallet[] = wallets.map((wallet: any) => ({
          walletId: !wallet.id ? wallet : wallet.id,
          contactId: existingContact.id,
          companyId
        }));

        await ContactWallet.bulkCreate(contactWallets, { transaction });
      }

      await transaction.commit();
      return existingContact.reload();
    }

    // Cria novo contato
    const settings = await CompaniesSettings.findOne({
      where: { companyId },
      transaction
    });

    const acceptAudioMessageDefault = settings?.acceptAudioMessageContact === 'enabled';

    const newContact = await Contact.create(
      {
        name,
        number,
        email,
        profilePicUrl,
        birthDatE: processedBirthDate,
        acceptAudioMessage: acceptAudioMessage !== undefined
          ? acceptAudioMessage
          : acceptAudioMessageDefault,
        active,
        extraInfo,
        companyId,
        remoteJid
      },
      {
        include: [
          "extraInfo",
          {
            association: "wallets",
            attributes: ["id", "name"]
          }
        ],
        transaction
      }
    );

    // Adiciona carteiras se fornecidas
    if (wallets) {
      const contactWallets: Wallet[] = wallets.map((wallet: any) => ({
        walletId: !wallet.id ? wallet : wallet.id,
        contactId: newContact.id,
        companyId
      }));

      await ContactWallet.bulkCreate(contactWallets, { transaction });
    }

    await transaction.commit();
    return newContact;
  } catch (error) {
    await transaction.rollback();

    // Tratamento específico para erro de constraint única
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Se ocorrer erro de duplicidade, tenta recuperar o contato novamente
      try {
        logger.warn(`Contato duplicado encontrado: ${number}. Tentando recuperar...`);
        const duplicateContact = await Contact.findOne({
          where: { number, companyId },
          paranoid: false // Busca inclusive excluídos logicamente
        });

        if (duplicateContact) {
          // Se estiver excluído, restaura
          if (duplicateContact.deletedAt) {
            await duplicateContact.restore();
            logger.info(`Restaurado contato que estava excluído logicamente: ${number}`);
          }
          return duplicateContact;
        }
      } catch (restoreError) {
        logger.error(`Erro ao tentar recuperar contato duplicado: ${restoreError}`);
      }

      throw new AppError("ERR_DUPLICATED_CONTACT");
    }

    logger.error(`Error creating contact: ${error}`);
    throw error;
  }
};

export default CreateContactService;