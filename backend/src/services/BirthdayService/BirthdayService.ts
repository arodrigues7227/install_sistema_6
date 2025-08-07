// src/services/BirthdayService/BirthdayService.ts
import User from "../../models/User";
import Contact from "../../models/Contact";
import BirthdaySettings from "../../models/BirthdaySettings";
import Announcement from "../../models/Announcement";
import Company from "../../models/Company";
import { getIO } from "../../libs/socket";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import logger from "../../utils/logger";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";

interface BirthdayPerson {
  id: number;
  name: string;
  type: 'user' | 'contact';
  age: number | null;
  birthDate: Date;
  companyId: number;
  whatsappId?: number;
  contactNumber?: string;
}

interface BirthdayData {
  users: BirthdayPerson[];
  contacts: BirthdayPerson[];
  settings: BirthdaySettings;
}

export class BirthdayService {
  
  /**
   * Busca todos os aniversariantes do dia de uma empresa
   */
  static async getTodayBirthdaysForCompany(companyId: number): Promise<BirthdayData> {
    // Buscar configurações da empresa
    const settings = await BirthdaySettings.getCompanySettings(companyId);
    
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Buscar usuários aniversariantes
    let users: BirthdayPerson[] = [];
    if (settings.userBirthdayEnabled) {
      const birthdayUsers = await User.findAll({
        where: {
          companyId,
          birthDate: {
            [require('sequelize').Op.and]: [
              require('sequelize').literal(`EXTRACT(MONTH FROM "birthDate") = ${month}`),
              require('sequelize').literal(`EXTRACT(DAY FROM "birthDate") = ${day}`)
            ]
          }
        }
      });

      users = birthdayUsers.map(user => ({
        id: user.id,
        name: user.name,
        type: 'user' as const,
        age: user.currentAge,
        birthDate: user.birthDate,
        companyId: user.companyId
      }));
    }

    // Buscar contatos aniversariantes
    let contacts: BirthdayPerson[] = [];
    if (settings.contactBirthdayEnabled) {
      const birthdayContacts = await Contact.findAll({
        where: {
          companyId,
          active: true,
          birthDate: {
            [require('sequelize').Op.and]: [
              require('sequelize').literal(`EXTRACT(MONTH FROM "birthDate") = ${month}`),
              require('sequelize').literal(`EXTRACT(DAY FROM "birthDate") = ${day}`)
            ]
          }
        },
        include: ['whatsapp']
      });

      contacts = birthdayContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        type: 'contact' as const,
        age: contact.currentAge,
        birthDate: contact.birthDate,
        companyId: contact.companyId,
        whatsappId: contact.whatsappId,
        contactNumber: contact.number
      }));
    }

    return {
      users,
      contacts,
      settings
    };
  }

  /**
   * Busca aniversariantes de todas as empresas
   */
  static async getAllTodayBirthdays(): Promise<{ [companyId: number]: BirthdayData }> {
    const companies = await Company.findAll({
      where: { status: true },
      attributes: ['id']
    });

    const result: { [companyId: number]: BirthdayData } = {};

    for (const company of companies) {
      const birthdayData = await this.getTodayBirthdaysForCompany(company.id);
      if (birthdayData.users.length > 0 || birthdayData.contacts.length > 0) {
        result[company.id] = birthdayData;
      }
    }

    return result;
  }

  /**
   * Envia mensagem de aniversário para um contato
   */
  static async sendBirthdayMessageToContact(
    contactId: number, 
    companyId: number,
    customMessage?: string
  ): Promise<boolean> {
    try {
      const contact = await Contact.findOne({
        where: { id: contactId, companyId },
        include: ['whatsapp']
      });

      if (!contact || !contact.whatsapp) {
        logger.warn(`Contact ${contactId} not found or no whatsapp configured`);
        return false;
      }

      // Buscar configurações da empresa
      const settings = await BirthdaySettings.getCompanySettings(companyId);
      
      // Usar mensagem personalizada ou padrão
      let message = customMessage || settings.contactBirthdayMessage;
      
      // Substituir placeholders
      message = message.replace(/{nome}/g, contact.name);
      if (contact.currentAge) {
        message = message.replace(/{idade}/g, contact.currentAge.toString());
      }

      const whatsapp = await ShowWhatsAppService(contact.whatsappId, contact.companyId);

      // Criar ou buscar ticket para o contato
      const ticket = await FindOrCreateTicketService(
        contact,
        whatsapp,
        0,
        companyId
      );

      // Enviar mensagem
      await SendWhatsAppMessage({
        body: `\u200e ${message}`,
        ticket
      });

      logger.info(`Birthday message sent to contact ${contact.name} (${contact.id})`);
      return true;

    } catch (error) {
      logger.error(`Error sending birthday message to contact ${contactId}:`, error);
      return false;
    }
  }

  /**
   * Cria informativo de aniversário para usuário
   */
  static async createUserBirthdayAnnouncement(
    user: User, 
    settings: BirthdaySettings
  ): Promise<void> {
    if (!settings.createAnnouncementForUsers) return;

    try {
      // Criar informativo para a empresa do usuário
      const announcement = await Announcement.createBirthdayAnnouncement(
        1, // Company ID 1 (sistema) cria o informativo
        user.companyId, // Mas é direcionado para a empresa do usuário
        user
      );

      // Emitir evento Socket.io para a empresa
      const io = getIO();
      io.of(String(user.companyId)).emit(`company-announcement`, {
        action: "create",
        record: announcement
      });

      logger.info(`Birthday announcement created for user ${user.name} (${user.id})`);

    } catch (error) {
      logger.error(`Error creating birthday announcement for user ${user.id}:`, error);
    }
  }

  /**
   * Processa todos os aniversários do dia
   */
  static async processTodayBirthdays(): Promise<void> {
    logger.info('Starting daily birthday processing...');

    try {
      const allBirthdays = await this.getAllTodayBirthdays();

      for (const [companyId, birthdayData] of Object.entries(allBirthdays)) {
        const companyIdNum = parseInt(companyId);
        const { users, contacts, settings } = birthdayData;

        logger.info(`Processing birthdays for company ${companyId}: ${users.length} users, ${contacts.length} contacts`);

        // Processar aniversários de usuários
        for (const userBirthday of users) {
          const user = await User.findByPk(userBirthday.id);
          if (user) {
            await this.createUserBirthdayAnnouncement(user, settings);
            
            // Emitir evento Socket.io para notificar sobre aniversário
            const io = getIO();
            io.of(String(companyIdNum)).emit(`user-birthday`, {
              user: {
                id: user.id,
                name: user.name,
                age: user.currentAge
              }
            });
          }
        }

        // Processar aniversários de contatos (envio automático se habilitado)
        for (const contactBirthday of contacts) {
          if (settings.contactBirthdayEnabled) {
            await this.sendBirthdayMessageToContact(
              contactBirthday.id,
              companyIdNum
            );
          }

          // Emitir evento Socket.io para notificar sobre aniversário de contato
          const io = getIO();
          io.of(String(companyIdNum)).emit(`contact-birthday`, {
            contact: {
              id: contactBirthday.id,
              name: contactBirthday.name,
              age: contactBirthday.age
            }
          });
        }
      }

      // Limpar informativos expirados
      const cleanedCount = await Announcement.cleanExpiredAnnouncements();
      if (cleanedCount > 0) {
        logger.info(`Cleaned ${cleanedCount} expired announcements`);
      }

      logger.info('Daily birthday processing completed successfully');

    } catch (error) {
      logger.error('Error in daily birthday processing:', error);
    }
  }

  /**
   * Atualiza configurações de aniversário de uma empresa
   */
  static async updateBirthdaySettings(
    companyId: number, 
    settingsData: Partial<BirthdaySettings>
  ): Promise<BirthdaySettings> {
    let settings = await BirthdaySettings.findOne({
      where: { companyId }
    });

    if (!settings) {
      settings = await BirthdaySettings.create({
        companyId,
        ...settingsData
      });
    } else {
      await settings.update(settingsData);
    }

    return settings;
  }

  /**
   * Busca configurações de aniversário de uma empresa
   */
  static async getBirthdaySettings(companyId: number): Promise<BirthdaySettings> {
    return BirthdaySettings.getCompanySettings(companyId);
  }
}

export default BirthdayService;