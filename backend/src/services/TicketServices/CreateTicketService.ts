import AppError from "../../errors/AppError";

import { Op } from "sequelize";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import GetDefaultWhatsAppByUser from "../../helpers/GetDefaultWhatsAppByUser";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import Queue from "../../models/Queue";
import User from "../../models/User";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";

import CreateLogTicketService from "./CreateLogTicketService";
import ShowTicketService from "./ShowTicketService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  companyId: number;
  queueId?: number;
  whatsappId: string;
}

interface ServiceResponse {
  ticketExists: boolean;
  ticket: Ticket | null;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId,
  whatsappId = ""
}: Request):  Promise<ServiceResponse> => {

  const io = getIO();

  let whatsapp;
  let defaultWhatsapp

  if (whatsappId !== "undefined" && whatsappId !== null && whatsappId !== "") {
    // console.log("GETTING WHATSAPP CREATE TICKETSERVICE", whatsappId)
    whatsapp = await ShowWhatsAppService(whatsappId, companyId)
  }


  defaultWhatsapp = await GetDefaultWhatsAppByUser(userId);

  if (whatsapp) {
    defaultWhatsapp = whatsapp;
  }
  if (!defaultWhatsapp)
    defaultWhatsapp = await GetDefaultWhatsApp(whatsapp.id, companyId);


  const checkTicket = await CheckContactOpenTickets(contactId, companyId, defaultWhatsapp.id);

  if (checkTicket.ticketExists) {
    // Se o ticket existe e pertence a outro usuário
    if (checkTicket.ticket.userId !== userId) {
      return {
        ticketExists: true,
        ticket: checkTicket.ticket
      };
    }
  }

  const { isGroup } = await ShowContactService(contactId, companyId);

  let ticket = await Ticket.create({
    contactId,
    companyId,
    whatsappId: defaultWhatsapp.id,
    channel: defaultWhatsapp.channel,
    isGroup,
    userId,
    isBot: true,
    queueId,
    status: isGroup ? "group" : "open",
    isActiveDemand: true
  });

  // await Ticket.update(
  //   { companyId, queueId, userId, status: isGroup? "group": "open", isBot: true },
  //   { where: { id } }
  // );

  ticket = await ShowTicketService(ticket.id, companyId);

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  io.of(String(companyId))
    // .to(ticket.status)
    // .to("notification")
    // .to(ticket.id.toString())
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

  await CreateLogTicketService({
    userId,
    queueId,
    ticketId: ticket.id,
    type: "create"
  });

  return {
    ticketExists: false,
    ticket: ticket
  };
};

export default CreateTicketService;
