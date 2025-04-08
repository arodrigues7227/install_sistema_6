import { WAMessage, delay } from "baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import { isNil } from "lodash";

import formatBody from "../../helpers/Mustache";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  msdelay?: number;
  vCard?: Contact;
  isForwarded?: boolean;
}

function extractNameFromVCard(vCard) {
  const lines = vCard.split('\n');
  for (const line of lines) {
    if (line.startsWith('FN:')) {
      return line.substring(3).trim();
    }
  }
  return null; // Retorna null se não encontrar o nome
}

const SendWhatsAppContact = async ({
  body,
  ticket
}: Request): Promise<WAMessage> => {
  let options = {};
  const wbot = await GetTicketWbot(ticket);
  const contactNumber = await Contact.findByPk(ticket.contactId)

  let number: string;

  if (contactNumber.remoteJid && contactNumber.remoteJid !== "" && contactNumber.remoteJid.includes("@")) {
    number = contactNumber.remoteJid;
  } else {
    number = `${contactNumber.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
      }`;
  }

  const name = extractNameFromVCard(body);

  if (!isNil(body)) {

    try {
      const sentMessage = await wbot.sendMessage(
        number,
        {
          contacts: {
            displayName: `${name}`,
            contacts: [{ vcard: body }]
          }
        }
      );
      await ticket.update({ lastMessage: formatBody(body, ticket), imported: null });
      return sentMessage;
    } catch (err) {
      Sentry.captureException(err);
      console.log(err);
      throw new AppError("ERR_SENDING_WAPP_MSG");
    }
  };
  
};

export default SendWhatsAppContact;
