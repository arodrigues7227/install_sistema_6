import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";
import { add } from "date-fns";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { dataMessages, getWbot } from "../../libs/wbot";
import { handleMessage } from "../WbotServices/wbotMessageListener";
import fs from 'fs';
import moment from "moment";
import { addLogs } from "../../helpers/addLogs";

export const closeTicketsImported = async (whatsappId: number) => {
  const tickets = await Ticket.findAll({
    where: {
      status: 'pending',
      whatsappId,
      imported: { [Op.lt]: +add(new Date(), { hours: +5 }) }
    }
  });

  for (const ticket of tickets) {
    await new Promise(r => setTimeout(r, 330));
    await UpdateTicketService({ 
      ticketData: { status: "closed" }, 
      ticketId: ticket.id, 
      companyId: ticket.companyId 
    });
  }
  
  let whatsApp = await Whatsapp.findByPk(whatsappId);
  await whatsApp.update({ statusImportMessages: null });
  
  const io = getIO();
  io.of(whatsApp.companyId.toString())
    .emit(`importMessages-${whatsApp.companyId}`, {
      action: "refresh",
    });
};

function sortByMessageTimestamp(a: any, b: any): number {
  const timestampA = Math.floor(a.messageTimestamp?.low || a.messageTimestamp || 0);
  const timestampB = Math.floor(b.messageTimestamp?.low || b.messageTimestamp || 0);
  return timestampA - timestampB; // Ordem crescente (mais antigas primeiro)
}

function cleaner(array: any[]): any[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }

  const mapa = new Map();
  const resultado = [];

  for (const objeto of array) {
    const valorChave = objeto?.key?.id;
    if (valorChave && !mapa.has(valorChave)) {
      mapa.set(valorChave, true);
      resultado.push(objeto);
    }
  }

  return resultado.sort(sortByMessageTimestamp);
}

const ImportWhatsAppMessageService = async (whatsappId: number | string): Promise<string> => {
  const whatsApp = await Whatsapp.findByPk(whatsappId);
  
  if (!whatsApp) {
    throw new AppError("ERR_WHATSAPP_NOT_FOUND", 404);
  }

  const wbot = getWbot(whatsApp.id);

  try {
    const io = getIO();
    const rawMessages = dataMessages[whatsappId] || [];
    const messages = cleaner(rawMessages);
    
    const dateOldLimit = new Date(whatsApp.importOldMessages).getTime();
    const dateRecentLimit = new Date(whatsApp.importRecentMessages).getTime();

    addLogs({
      fileName: `processImportMessagesWppId${whatsappId}.txt`, 
      forceNewFile: true,
      text: `INICIANDO IMPORTAÇÃO DE MENSAGENS:
Whatsapp nome: ${whatsApp.name}
Whatsapp Id: ${whatsApp.id}
Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
Data de início da importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")}
Total de mensagens para processar: ${messages.length}

DETALHES DAS MENSAGENS:
`
    });

    // Log detalhado das mensagens que serão processadas
    let sentCount = 0;
    let receivedCount = 0;
    let groupCount = 0;
    
    messages.forEach((msg, index) => {
      const timestampMsg = Math.floor(msg.messageTimestamp?.low || msg.messageTimestamp || 0);
      const isFromMe = msg.key?.fromMe;
      const isGroup = msg.key?.remoteJid?.includes('@g.us');
      
      if (isGroup) {
        groupCount++;
      } else if (isFromMe) {
        sentCount++;
      } else {
        receivedCount++;
      }
      
      if (index < 10) { // Log apenas as primeiras 10 para debug
        addLogs({
          fileName: `processImportMessagesWppId${whatsappId}.txt`,
          text: `Mensagem ${index + 1}: ${moment(timestampMsg * 1000).format("DD/MM/YY HH:mm")} - ${isFromMe ? 'ENVIADA' : 'RECEBIDA'} - ${msg.key?.remoteJid}`
        });
      }
    });

    addLogs({
      fileName: `processImportMessagesWppId${whatsappId}.txt`,
      text: `ESTATÍSTICAS FINAIS:
Total: ${messages.length}
Enviadas por mim: ${sentCount}
Recebidas de contatos: ${receivedCount}
Mensagens de grupos: ${groupCount}

INICIANDO PROCESSAMENTO...
`
    });

    const qtd = messages.length;
    let i = 0;
    let processedCount = 0;
    let errorCount = 0;

    while (i < qtd) {
      try {
        const msg = messages[i];
        const timestampMsg = Math.floor(msg.messageTimestamp?.low || msg.messageTimestamp || 0);
        
        addLogs({
          fileName: `processImportMessagesWppId${whatsappId}.txt`, 
          text: `Processando mensagem ${i + 1} de ${qtd} - ${moment(timestampMsg * 1000).format("DD/MM/YY HH:mm:ss")} - ${msg.key?.fromMe ? 'ENVIADA' : 'RECEBIDA'}`
        });

        await handleMessage(msg, wbot, whatsApp.companyId, true);
        processedCount++;

        // Emitir progresso a cada 5 mensagens ou em marcos importantes
        if (i % 5 === 0 || i === qtd - 1) {
          io.of(whatsApp.companyId.toString())
            .emit(`importMessages-${whatsApp.companyId}`, {
              action: "update",
              status: { 
                this: i + 1, 
                all: qtd, 
                date: moment(timestampMsg * 1000).format("DD/MM/YY HH:mm:ss"),
                processed: processedCount,
                errors: errorCount
              }
            });
        }

        // Finalizar importação
        if (i + 1 === qtd) {
          dataMessages[whatsappId] = [];

          addLogs({
            fileName: `processImportMessagesWppId${whatsappId}.txt`,
            text: `IMPORTAÇÃO FINALIZADA:
Total processadas: ${processedCount}
Erros: ${errorCount}
Data/hora finalização: ${moment().format("DD/MM/YYYY HH:mm:ss")}
`
          });

          if (whatsApp.closedTicketsPostImported) {
            await closeTicketsImported(Number(whatsappId));
          }
          
          await whatsApp.update({
            statusImportMessages: whatsApp.closedTicketsPostImported ? null : "renderButtonCloseTickets",
            importOldMessages: null,
            importRecentMessages: null
          });

          io.of(whatsApp.companyId.toString())
            .emit(`importMessages-${whatsApp.companyId}`, {
              action: "refresh",
            });
        }
        
      } catch (error) {
        errorCount++;
        addLogs({
          fileName: `processImportMessagesWppId${whatsappId}.txt`,
          text: `ERRO ao processar mensagem ${i + 1}: ${error.message}`
        });
      }

      i++;
      
      // Pequeno delay para evitar sobrecarga
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

  } catch (error) {
    addLogs({
      fileName: `processImportMessagesWppId${whatsappId}.txt`,
      text: `ERRO CRÍTICO na importação: ${error.message}`
    });
    throw new AppError("ERR_NOT_MESSAGE_TO_IMPORT", 403);
  }

  return "whatsapps";
};

export default ImportWhatsAppMessageService;