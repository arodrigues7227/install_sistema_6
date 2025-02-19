import * as Sentry from "@sentry/node";
import fs from "fs/promises";
import path from "path";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  WAMessage,
  WAMessageKey,
  WASocket,
  WAVersion,
  isJidBroadcast,
  isJidGroup,
  isJidStatusBroadcast,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  proto
} from "@whiskeysockets/baileys";
import { FindOptions } from "sequelize/types";
import Baileys from "../models/Baileys";
import Whatsapp from "../models/Whatsapp";
import logger from "../utils/logger";
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import cacheLayer from "./cache";
import { useMultiFileAuthState } from '../helpers/useMultiFileAuthState';
import ImportContactsService from "../services/WbotServices/ImportContactsService";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import ImportWhatsAppMessageService from "../services/WhatsappService/ImportWhatsAppMessageService";
import { add } from "date-fns";
import moment from "moment";
import { getTypeMessage, isValidMsg } from "../services/WbotServices/wbotMessageListener";
import { addLogs } from "../helpers/addLogs";
import NodeCache from 'node-cache';
import { Store } from "./store";
import Message from "../models/Message";
import { Sequelize } from "sequelize-typescript";

const version: WAVersion = [2, 3000, 1016249039];

const maxRetriesQrCode = 3;

const msgRetryCounterCache = new NodeCache();

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error"; // info // trace

type Session = WASocket & { id?: number; store?: Store; };

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();
const retriesConnectionMap = new Map<number, number>();

const retryCounter: { [key: number]: number } = {};

export var dataMessages: any = {};

export const msgDB = msg();

export default function msg() {
  return {
    get: async (key: WAMessageKey, companyId: number) => {
      const { id } = key;
      logger.info(`Buscando mensagem no cache ${id}`)
      if (!id) return;
      let data = await Message.findOne({
        where: {
          wid: id,
          companyId
        }
      });
      if (data) {
        logger.info(`Mensagem encontrada no cache ${data.body}`)
        try {
          let msg = JSON.parse(data.dataJson);
          return msg.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
  }
}

export const restartWbotId = (whatsappId: number) => {
  logger.info(`Restarting session ${whatsappId}`);
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].ws.close(undefined);
  }
}

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const restartWbot = async (companyId: number, session?: any): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id", "name"],
    }

    const whatsapp = await Whatsapp.findAll(options);

    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        console.log(`Reiniciando sessão ${c.name} ID ${c.id} na empresa ${companyId}`);
        sessions[sessionIndex].ws.close();
      }

    });

  } catch (err) {
    logger.error(err);
  }
};

export const removeWbot = async (whatsappId: number, isLogout = true): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close(undefined);
      }

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export async function deleteFolder(folder) {
  try {
    await fs.rm(folder, { recursive: true });
    console.log('Pasta deletada com sucesso!', folder);
  } catch (err) {
    console.error('Erro ao deletar pasta:', err);
  }
}

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const io = getIO();
        let proxy: any;

        const whatsappUpdate = await Whatsapp.findOne({ where: { id: whatsapp.id } });

        if (!whatsappUpdate) return;

        const { id, name, companyId, allowGroup } = whatsappUpdate;

        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;
        let retriesConnection = 0;
        let pairingCodeRequested = false;
        let pairingCode = "";
        let wsocket: Session = null;

        const { state, saveCreds } = await useMultiFileAuthState(whatsapp);

        wsocket = makeWASocket({
          version: version,
          logger: loggerBaileys,
          printQRInTerminal: false,
          auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          generateHighQualityLinkPreview: false,
          linkPreviewImageThumbnailWidth: 192,
          shouldIgnoreJid: (jid) => {
            return isJidBroadcast(jid) || (!allowGroup && isJidGroup(jid)) //|| jid.includes('newsletter')
          },
          browser: [
            process.env.BROWSER_CLIENT || "LIOT|Chat",
            process.env.BROWSER_NAME || "Chrome",
            process.env.BROWSER_VERSION || "10.0"
          ],
          msgRetryCounterCache,
          markOnlineOnConnect: true,
          maxMsgRetryCount: 5,
          emitOwnEvents: true,
          syncFullHistory: true,
          defaultQueryTimeoutMs: 60_000,
          fireInitQueries: true,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
          connectTimeoutMs: 30_000,
          keepAliveIntervalMs: 15_000,
          getMessage: async (key) => await msgDB.get(key, companyId),          
        });

        setTimeout(async () => {
          const wpp = await Whatsapp.findByPk(whatsapp.id);
          // console.log("Status:::::", wpp.status)
          if (wpp?.importOldMessages && wpp.status === "CONNECTED") {
            // console.log("Importando mensagens")
            let dateOldLimit = new Date(wpp.importOldMessages).getTime();
            let dateRecentLimit = new Date(wpp.importRecentMessages).getTime();

            addLogs({
              fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, forceNewFile: true,
              text: `Aguardando conexão para iniciar a importação de mensagens:
  Whatsapp nome: ${wpp.name}
  Whatsapp Id: ${wpp.id}
  Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
  Selecionado Data de inicio de importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
  Selecionado Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")} 
  `})

            const statusImportMessages = new Date().getTime();

            await wpp.update({
              statusImportMessages
            });
            wsocket.ev.on("messaging-history.set", async ({ messages, chats, isLatest, contacts }) => {
              console.log("messages", messages.length)
              console.log("chats", chats.length)
              console.log("isLatest", isLatest)
              console.log("contacts", contacts.length)

              const statusImportMessages = new Date().getTime();

              await wpp.update({
                statusImportMessages
              });
              const whatsappId = whatsapp.id;
              // let filteredMessages = messageSet.messages
              let filteredDateMessages = []
              if (messages && messages.length > 0) {
                for await (const [, msg] of Object.entries(messages)) {
                  const timestampMsg = Math.floor(msg.messageTimestamp["low"] * 1000)
                  if (isValidMsg(msg) && dateOldLimit < timestampMsg && dateRecentLimit > timestampMsg) {
                    if (msg.key?.remoteJid.split("@")[1] != "g.us") {
                      addLogs({
                        fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Não é Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                      filteredDateMessages.push(msg)
                    } else {
                      if (wpp?.importOldMessagesGroups) {
                        addLogs({
                          fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                        filteredDateMessages.push(msg)
                      }
                    }
                  }

                };
              }

              if (!dataMessages?.[whatsappId]) {
                dataMessages[whatsappId] = [];

                dataMessages[whatsappId].unshift(...filteredDateMessages);
              } else {
                dataMessages[whatsappId].unshift(...filteredDateMessages);
              }

              setTimeout(async () => {
                const wpp = await Whatsapp.findByPk(whatsappId);
                io.of(String(companyId))
                  .emit(`importMessages-${wpp.companyId}`, {
                    action: "update",
                    status: { this: -1, all: -1 }
                  });
                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
                //console.log(JSON.stringify(wpp, null, 2));
              }, 500);

              setTimeout(async () => {


                const wpp = await Whatsapp.findByPk(whatsappId);

                if (wpp?.importOldMessages) {
                  let isTimeStamp = !isNaN(
                    new Date(Math.floor(parseInt(wpp?.statusImportMessages))).getTime()
                  );

                  if (isTimeStamp) {
                    const ultimoStatus = new Date(
                      Math.floor(parseInt(wpp?.statusImportMessages))
                    ).getTime();
                    const dataLimite = +add(ultimoStatus, { seconds: +45 }).getTime();

                    if (dataLimite < new Date().getTime()) {
                      //console.log("Pronto para come?ar")
                      ImportWhatsAppMessageService(wpp.id)
                      wpp.update({
                        statusImportMessages: "Running"
                      })

                    } else {
                      //console.log("Aguardando inicio")
                    }
                  }
                }
                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
              }, 1000 * 45);

            });
          }

        }, 2500);

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {

            // logger.info(`Socket ${name} Connection Update ${connection || ""} ${lastDisconnect ? lastDisconnect.error.message : ""}`);

            if (connection === "close") {
              const status = (lastDisconnect?.error as Boom)?.output?.statusCode;
              const reason = Object.entries(DisconnectReason).find(i => i[1] === status)?.[0] || 'unknown'

              logger.warn(`DESCONECTOU REASON: ${reason} --> ${JSON.stringify(lastDisconnect)}`);
              logger.info(`Socket ${name} Connection Update ${connection || ""} ${lastDisconnect ? lastDisconnect.error.message : ""} - Retries Connection: ${retriesConnection}`);

              // BAN
              if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);

                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                removeWbot(id, false);
                delete retryCounter[id];
              }

              if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                removeWbot(id, false);
                setTimeout(
                  () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                  2000
                );
                retriesConnectionMap.set(id, (retriesConnection += 1));

              } else {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);

                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                removeWbot(id, false);
                setTimeout(
                  () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                  2000
                );
                retriesConnectionMap.set(id, (retriesConnection += 1));

              }
            }

            if (connection === "open") {

              if (
                receivedPendingNotifications &&
                !wsocket.authState.creds?.myAppStateKeyId
              ) {
                try {
                  await wsocket?.cleanDirtyBits('account_sync')
                  await wsocket?.cleanDirtyBits('groups')
                  wsocket?.ev.flush()
                } catch (error) {
                  console.log('Erro ao limpar bits sujos:', error);
                }
              }

              await wsocket.refreshMediaConn();

              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number:
                  wsocket.type === "md"
                    ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                    : "-"
              });

              io.of(String(companyId))
                .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              }

              retriesConnectionMap.set(id, (retriesConnection += 1));

              logger.info(
                `Socket  ${name} Connection Update ${connection || ""} ${lastDisconnect ? lastDisconnect.error.message : ""
                } - Retries Connection: ${retriesConnection}`
              );

              resolve(wsocket);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= maxRetriesQrCode) {
                logger.info(`Socket ${name} atingiu ${maxRetriesQrCode} tentativas de QrCode`);
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: "",
                  number: "",
                  pairingCode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);

                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsappUpdate
                  });

                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0,
                  number: "",
                  pairingCode: pairingCode
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
              }
            }
          }
        );

        wsocket.ev.on("contacts.upsert", async (contacts: any) => {
          try {
            // Busca o registro do Baileys para este WhatsApp
            const baileysData = await Baileys.findOne({
              where: { whatsappId: whatsapp.id }
            });
        
            if (baileysData) {
              // Atualiza os contatos existentes ou adiciona novos
              const currentContacts = baileysData.contacts
                ? JSON.parse(baileysData.contacts)
                : [];
        
              // Mescla os contatos existentes com os novos
              const updatedContacts = [...currentContacts];
        
              contacts.forEach(async (contact) => {
                const index = updatedContacts.findIndex(
                  c => c.id === contact.id
                );
                if (index > -1) {
                  updatedContacts[index] = contact;
                } else {
                  updatedContacts.push(contact);
                }
        
                // Atualiza o contato no seu sistema
                if (typeof contact.imgUrl !== 'undefined' && contact.imgUrl !== null) {
                  try {
                    // Tenta obter a nova URL da foto de perfil
                    const newUrl = await wsocket.profilePictureUrl(contact.id.replace(/\D/g, ""), "image", 60_000);
        
                    // Prepara os dados do contato para atualização no seu sistema
                    const contactData = {
                      name: contact.name.replace(/\D/g, "") || "Sem nome",
                      number: contact.id.replace(/\D/g, ""),
                      isGroup: contact.id.includes("@g.us") ? true : false,
                      companyId: companyId,
                      remoteJid: contact.id,
                      profilePicUrl: newUrl,
                      whatsappId: wsocket.id,
                      wbot: wsocket
                    };
        
                    // Chama o serviço para criar ou atualizar o contato no seu sistema
                    await CreateOrUpdateContactService(contactData);
                  } catch (error) {
                    console.error(`Erro ao obter a foto de perfil do contato ${contact.name}:`, error);
                  }
                } else if (contact.imgUrl === null) {
                  // Se a imagem do perfil for null (ou seja, o contato não tem uma foto de perfil definida)
                  const contactData = {
                    name: contact.name.replace(/\D/g, "") || "Sem nome",
                    number: contact.id.replace(/\D/g, ""),
                    isGroup: contact.id.includes("@g.us") ? true : false,
                    companyId: companyId,
                    remoteJid: contact.id,
                    profilePicUrl: `${process.env.FRONTEND_URL}/avatarpadrao.png`, // Define a URL da foto de perfil como null
                    whatsappId: wsocket.id,
                    wbot: wsocket
                  };
        
                  // Chama o serviço para criar ou atualizar o contato no seu sistema
                  await CreateOrUpdateContactService(contactData);
                }
              });
        
              // Salva os contatos atualizados na tabela Baileys
              await baileysData.update({
                contacts: JSON.stringify(updatedContacts)
              });
        
              logger.info(
                `Contatos atualizados para WhatsApp ${whatsapp.id}: ${contacts.length} novos/atualizados`
              );
            } else {
              // Se não existir registro, cria um novo
              await Baileys.create({
                whatsappId: whatsapp.id,
                contacts: JSON.stringify(contacts)
              });
        
              logger.info(
                `Novo registro de contatos criado para WhatsApp ${whatsapp.id}`
              );
        
              // Atualiza os contatos no seu sistema
              contacts.forEach(async (contact) => {
                if (typeof contact.imgUrl !== 'undefined' && contact.imgUrl !== null) {
                  try {
                    const newUrl = await wsocket.profilePictureUrl(contact.id.replace(/\D/g, ""), "image", 60_000);
        
                    const contactData = {
                      name: contact.name.replace(/\D/g, "") || "Sem nome",
                      number: contact.id.replace(/\D/g, ""),
                      isGroup: contact.id.includes("@g.us") ? true : false,
                      companyId: companyId,
                      remoteJid: contact.id,
                      profilePicUrl: newUrl,
                      whatsappId: wsocket.id,
                      wbot: wsocket
                    };
        
                    await CreateOrUpdateContactService(contactData);
                  } catch (error) {
                    console.error(`Erro ao obter a foto de perfil do contato ${contact.name}:`, error);
                  }
                } else if (contact.imgUrl === null) {
                  const contactData = {
                    name: contact.name.replace(/\D/g, "") || "Sem nome",
                    number: contact.id.replace(/\D/g, ""),
                    isGroup: contact.id.includes("@g.us") ? true : false,
                    companyId: companyId,
                    remoteJid: contact.id,
                    profilePicUrl: `${process.env.FRONTEND_URL}/avatarpadrao.png`,
                    whatsappId: wsocket.id,
                    wbot: wsocket
                  };
        
                  await CreateOrUpdateContactService(contactData);
                }
              });
            }
          } catch (error) {
            logger.error(
              `Erro ao salvar contatos do WhatsApp ${whatsapp.id}:`,
              error
            );
          }
        });


        wsocket.ev.on("creds.update", saveCreds);
        // wsocket.store = store;
        // store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log('error_init_wbot', error);
      reject(error);
    }
  });
};