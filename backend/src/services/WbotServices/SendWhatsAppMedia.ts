import { WAMessage, AnyMessageContent } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import Contact from "../../models/Contact";
import { getWbot } from "../../libs/wbot";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isPrivate?: boolean;
  isForwarded?: boolean;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const convertAudio = async (
  inputPath: string,
  outputPath: string,
  format: 'ogg' | 'mp3'
): Promise<void> => {
  const codecParams = format === 'ogg' 
    ? '-c:a libopus -b:a 16k -ac 1 -ar 48000' 
    : '-c:a libmp3lame -b:a 64k -ac 1 -ar 44100';

  try {
    await new Promise((resolve, reject) => {
      exec(
        `${ffmpegPath.path} -y -i ${inputPath} ${codecParams} -avoid_negative_ts make_zero ${outputPath}`,
        (error, _stdout, _stderr) => {
          if (error) {
            console.error(`Erro na conversão para ${format}:`, error);
            reject(error);
          } else {
            console.log(`Conversão para ${format} finalizada com sucesso`);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error(`Erro na conversão para ${format}:`, error);
    throw error;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body = "",
  isPrivate = false,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await getWbot(ticket.whatsappId);
    const companyId = ticket.companyId.toString();

    const pathMedia = media.path;
    const typeMessage = media.mimetype.split("/")[0];
    let options: AnyMessageContent;
    let bodyTicket = "";
    const bodyMedia = ticket ? formatBody(body, ticket) : body;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "🎥 Arquivo de vídeo";
    } else if (typeMessage === "audio") {
      // Cria diretório para empresa se não existir
      const companyFolder = path.join(publicFolder, `company${companyId}`);
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      const timestamp = new Date().getTime();
      const oggPath = path.join(companyFolder, `${timestamp}.ogg`);
      const mp3Path = path.join(companyFolder, `${timestamp}.mp3`);

      // Converte para ambos os formatos
      await convertAudio(pathMedia, oggPath, 'ogg');
      await convertAudio(pathMedia, mp3Path, 'mp3');

      // Use OGG para WhatsApp
      options = {
        audio: fs.readFileSync(oggPath),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        caption: bodyMedia,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };

      // Limpa arquivo temporário original
      try {
        fs.unlinkSync(pathMedia);
        if (isPrivate) {
          fs.unlinkSync(oggPath);
          fs.unlinkSync(mp3Path);
        }
      } catch (error) {
        console.error("Error deleting temp file:", error);
      }

      bodyTicket = "🎵 Arquivo de áudio";
    } else if (typeMessage === "document" || typeMessage === "text") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📂 Documento";
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📎 Outros anexos";
    } else {
      if (media.mimetype.includes("gif")) {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: bodyMedia,
          mimetype: "image/gif",
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
          gifPlayback: true
        };
      } else {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: bodyMedia,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
      }
      bodyTicket = "📎 Outros anexos";
    }

    if (isPrivate === true) {
      const messageData = {
        wid: `PVT${companyId}${ticket.id}${body.substring(0, 6)}`,
        ticketId: ticket.id,
        contactId: undefined,
        body: bodyMedia,
        fromMe: true,
        mediaUrl: media.filename,
        mediaType: media.mimetype.split("/")[0],
        read: true,
        quotedMsgId: null,
        ack: 2,
        remoteJid: null,
        participant: null,
        dataJson: null,
        ticketTrakingId: null,
        isPrivate
      };

      await CreateMessageService({ messageData, companyId: ticket.companyId });
      return;
    }

    const contactNumber = await Contact.findByPk(ticket.contactId);

    let number: string;

    if (contactNumber.remoteJid && contactNumber.remoteJid !== "" && contactNumber.remoteJid.includes("@")) {
      number = contactNumber.remoteJid;
    } else {
      number = `${contactNumber.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`;
    }

    const sentMessage = await wbot.sendMessage(
      number,
      {
        ...options
      }
    );

    await ticket.update({
      lastMessage: body !== media.filename ? body : bodyMedia,
      imported: null
    });

    return sentMessage;
  } catch (err) {
    console.log(`ERRO AO ENVIAR MIDIA ${ticket.id} media ${media.originalname}`);
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

const processAudio = async (media: Express.Multer.File, companyId: string) => {
  const companyFolder = path.join(publicFolder, `company${companyId}`);
  // Garante que a pasta da empresa existe
  if (!fs.existsSync(companyFolder)) {
    fs.mkdirSync(companyFolder, { recursive: true });
  }

  const timestamp = new Date().getTime();
  const basename = `${timestamp}_audio`;
  const oggPath = path.join(companyFolder, `${basename}.ogg`);
  const mp3Path = path.join(companyFolder, `${basename}.mp3`);

  try {
    // Converte para ambos os formatos
    await convertAudio(media.path, oggPath, 'ogg');
    await convertAudio(media.path, mp3Path, 'mp3');

    // Remove arquivo temporário original
    fs.unlinkSync(media.path);

    // Retorna o caminho do OGG para o WhatsApp
    return oggPath;
  } catch (error) {
    console.error("Erro no processamento do áudio:", error);
    throw error;
  }
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body: string = " "
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia) || "";
  const typeMessage = mimeType.split("/")[0];

  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body || null,
        fileName: fileName
      };
    } else if (typeMessage === "audio") {
      const audioPath = await processAudio({ path: pathMedia } as Express.Multer.File, companyId || "0");
      options = {
        audio: fs.readFileSync(audioPath),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      };
      
      if (!pathMedia.includes(audioPath)) {
        // Se o caminho for diferente, podemos apagar o arquivo gerado
        fs.unlinkSync(audioPath);
      }
    } else if (typeMessage === "document" || typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body || null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body || null,
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

export default SendWhatsAppMedia;