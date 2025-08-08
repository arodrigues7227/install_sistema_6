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
import { Op } from "sequelize";

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
   * CORREÇÃO: Busca configurações de aniversário da empresa
   */
  static async getBirthdaySettings(companyId: number): Promise<BirthdaySettings> {
    console.log("🔍 Buscando configurações para empresa:", companyId);
    
    try {
      // Primeiro, tentar buscar configurações existentes
      let settings = await BirthdaySettings.findOne({
        where: { companyId }
      });

      // Se não existir, criar configurações padrão
      if (!settings) {
        console.log("⚠️ Configurações não encontradas, criando padrão...");
        
        settings = await BirthdaySettings.create({
          companyId,
          userBirthdayEnabled: true,
          contactBirthdayEnabled: false,
          createAnnouncementForUsers: false,
          userBirthdayMessage: '🎉 Parabéns {nome}! Hoje é seu aniversário! Desejamos um dia repleto de alegria e realizações! 🎂',
          contactBirthdayMessage: '🎉 Parabéns {nome}! Hoje você completa {idade} anos! Desejamos um ano repleto de felicidade e conquistas! 🎂',
          sendBirthdayTime: '09:00:00'
        });
        
        console.log("✅ Configurações padrão criadas:", settings.toJSON());
      }

      return settings;
    } catch (error) {
      console.error("❌ Erro ao buscar/criar configurações:", error);
      throw error;
    }
  }

  /**
   * CORREÇÃO: Atualiza configurações de aniversário
   */
  static async updateBirthdaySettings(
    companyId: number, 
    settingsData: Partial<BirthdaySettings>
  ): Promise<BirthdaySettings> {
    console.log("🔄 Atualizando configurações:", { companyId, settingsData });
    
    try {
      let settings = await BirthdaySettings.findOne({
        where: { companyId }
      });

      if (!settings) {
        // Criar nova configuração se não existir
        settings = await BirthdaySettings.create({
          companyId,
          ...settingsData
        });
        console.log("✅ Novas configurações criadas");
      } else {
        // Atualizar configuração existente
        await settings.update(settingsData);
        console.log("✅ Configurações atualizadas");
      }

      return settings;
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações:", error);
      throw error;
    }
  }

  /**
   * Busca todos os aniversariantes do dia de uma empresa
   */
  static async getTodayBirthdaysForCompany(companyId: number): Promise<BirthdayData> {
    console.log("🎂 Buscando aniversariantes do dia para empresa:", companyId);
    
    // Buscar configurações da empresa
    const settings = await this.getBirthdaySettings(companyId);
    
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
            [Op.and]: [
              { [Op.ne]: null },
              // Para PostgreSQL - ajuste conforme seu banco
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
        age: user.birthDate ? this.calculateAge(user.birthDate) : null,
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
            [Op.and]: [
              { [Op.ne]: null },
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
        age: contact.birthDate ? this.calculateAge(contact.birthDate) : null,
        birthDate: contact.birthDate,
        companyId: contact.companyId,
        whatsappId: contact.whatsappId,
        contactNumber: contact.number
      }));
    }

    console.log(`🎉 Encontrados: ${users.length} usuários e ${contacts.length} contatos aniversariantes`);

    return {
      users,
      contacts,
      settings
    };
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
      console.log("📤 Enviando mensagem de aniversário:", { contactId, companyId });
      
      const contact = await Contact.findOne({
        where: { id: contactId, companyId },
        include: ['whatsapp']
      });

      if (!contact || !contact.whatsapp) {
        logger.warn(`Contact ${contactId} not found or no whatsapp configured`);
        return false;
      }

      // Buscar configurações da empresa
      const settings = await this.getBirthdaySettings(companyId);
      
      // Usar mensagem personalizada ou padrão
      let message = customMessage || settings.contactBirthdayMessage;
      
      // Substituir placeholders
      message = message.replace(/{nome}/g, contact.name);
      if (contact.birthDate) {
        const age = this.calculateAge(contact.birthDate);
        message = message.replace(/{idade}/g, age.toString());
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
   * Calcular idade
   */
  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
      const announcement = await Announcement.create({
        companyId: user.companyId,
        title: `🎉 Aniversário de ${user.name}!`,
        text: `Hoje é aniversário do(a) ${user.name}! Parabenize nosso(a) colaborador(a)! 🎂`,
        status: true,
        priority: 1
      });

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
      const companies = await Company.findAll({
        where: { status: true },
        attributes: ['id']
      });

      for (const company of companies) {
        const birthdayData = await this.getTodayBirthdaysForCompany(company.id);
        const { users, contacts, settings } = birthdayData;

        logger.info(`Processing birthdays for company ${company.id}: ${users.length} users, ${contacts.length} contacts`);

        // Processar aniversários de usuários
        for (const userBirthday of users) {
          const user = await User.findByPk(userBirthday.id);
          if (user) {
            await this.createUserBirthdayAnnouncement(user, settings);
            
            // Emitir evento Socket.io para notificar sobre aniversário
            const io = getIO();
            io.of(String(company.id)).emit(`user-birthday`, {
              user: {
                id: user.id,
                name: user.name,
                age: userBirthday.age
              }
            });
          }
        }

        // Processar aniversários de contatos (envio automático se habilitado)
        for (const contactBirthday of contacts) {
          if (settings.contactBirthdayEnabled) {
            await this.sendBirthdayMessageToContact(
              contactBirthday.id,
              company.id
            );
          }

          // Emitir evento Socket.io para notificar sobre aniversário de contato
          const io = getIO();
          io.of(String(company.id)).emit(`contact-birthday`, {
            contact: {
              id: contactBirthday.id,
              name: contactBirthday.name,
              age: contactBirthday.age
            }
          });
        }
      }

      logger.info('Daily birthday processing completed successfully');

    } catch (error) {
      logger.error('Error in daily birthday processing:', error);
    }
  }
}

export default BirthdayService;