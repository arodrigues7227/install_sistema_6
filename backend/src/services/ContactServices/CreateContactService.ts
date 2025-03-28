import AppError from "../../errors/AppError";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import logger from "../../utils/logger";
import ContactWallet from "../../models/ContactWallet";
import sequelize from "../../database"; // Importe a instância do Sequelize

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
  wallets = null
}: Request): Promise<Contact> => {
  const transaction = await sequelize.transaction();

  try {
    // Verifica se o contato já existe
    const existingContact = await Contact.findOne({
      where: { number, companyId },
      transaction,
      include: [
        "extraInfo",
        {
          association: "wallets",
          attributes: ["id", "name"]
        }
      ]
    });

    if (existingContact) {
      // Atualiza o contato existente
      await existingContact.update(
        {
          name,
          email,
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
      return existingContact.reload({ transaction });
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
      const duplicateContact = await Contact.findOne({
        where: { number, companyId }
      });
      
      if (duplicateContact) {
        logger.warn(`Contato duplicado encontrado após falha: ${number}`);
        return duplicateContact;
      }
      
      throw new AppError("ERR_DUPLICATED_CONTACT");
    }

    logger.error(`Error creating contact: ${error}`);
    throw error;
  }
};

export default CreateContactService;