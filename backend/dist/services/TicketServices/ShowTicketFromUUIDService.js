"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Contact_1 = __importDefault(require("../../models/Contact"));
const User_1 = __importDefault(require("../../models/User"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Tag_1 = __importDefault(require("../../models/Tag"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const Company_1 = __importDefault(require("../../models/Company"));
const QueueIntegrations_1 = __importDefault(require("../../models/QueueIntegrations"));
const ShowTicketUUIDService = async (uuid, companyId) => {
    const ticket = await Ticket_1.default.findOne({
        where: {
            uuid,
            companyId
        },
        attributes: [
            "id",
            "uuid",
            "queueId",
            "isGroup",
            "channel",
            "status",
            "contactId",
            "useIntegration",
            "lastMessage",
            "updatedAt",
            "unreadMessages",
            "companyId",
            "whatsappId",
            "imported",
            "lgpdAcceptedAt",
            "amountUsedBotQueues",
            "useIntegration",
            "integrationId",
            "userId",
            "amountUsedBotQueuesNPS",
            "lgpdSendMessageAt",
            "isBot"
        ],
        include: [
            {
                model: Contact_1.default,
                as: "contact",
                attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "disableBot", "urlPicture", "companyId"],
                include: ["extraInfo", "tags",
                    {
                        association: "wallets",
                        attributes: ["id", "name"]
                    }]
            },
            {
                model: Queue_1.default,
                as: "queue",
                attributes: ["id", "name", "color"]
            },
            {
                model: User_1.default,
                as: "user",
                attributes: ["id", "name"]
            },
            {
                model: Tag_1.default,
                as: "tags",
                attributes: ["id", "name", "color"]
            },
            {
                model: Whatsapp_1.default,
                as: "whatsapp",
                attributes: ["id", "name", "groupAsTicket", "greetingMediaAttachment", "facebookUserToken", "facebookUserId"]
            },
            {
                model: Company_1.default,
                as: "company",
                attributes: ["id", "name"]
            },
            {
                model: QueueIntegrations_1.default,
                as: "queueIntegration",
                attributes: ["id", "name"]
            }
        ]
    });
    if (!ticket) {
        throw new AppError_1.default("ERR_NO_TICKET_FOUND", 404);
    }
    return ticket;
};
exports.default = ShowTicketUUIDService;