import React, { useState, useRef, useEffect, useContext } from "react";
import { useTheme } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import useSound from "use-sound";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";

import TicketListItemCustom from "../TicketListItemCustom";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import Favicon from "react-favicon";
import defaultLogoFavicon from "../../assets/favicon.ico";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const useStyles = makeStyles(theme => ({
	tabContainer: {
		overflowY: "auto",
		maxHeight: 350,
		...theme.scrollbarStyles,
	},
	popoverPaper: {
		width: "100%",
		maxWidth: 350,
		marginLeft: theme.spacing(2),
		marginRight: theme.spacing(1),
		[theme.breakpoints.down("sm")]: {
			maxWidth: 270,
		},
	},
	noShadow: {
		boxShadow: "none !important",
	},
}));

const NotificationsPopOver = ({ volume }) => {
	const classes = useStyles();
	const theme = useTheme();

	const history = useHistory();
	const { user, socket } = useContext(AuthContext);
	const { profile, queues } = user;

	const ticketIdUrl = +history.location.pathname.split("/")[2];
	const ticketIdRef = useRef(ticketIdUrl);
	const anchorEl = useRef();
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const queueIds = queues.map((q) => q.id);
	const { get: getSetting } = useCompanySettings();
    const { setCurrentTicket, setTabOpen } = useContext(TicketsContext);

	const [showTicketWithoutQueue, setShowTicketWithoutQueue] = useState(false);
	const [showNotificationPending, setShowNotificationPending] = useState(false);
	const [showGroupNotification, setShowGroupNotification] = useState(false);

	const [desktopNotifications, setDesktopNotifications] = useState([]);
	const [isIOS, setIsIOS] = useState(false);
	const [isPWA, setIsPWA] = useState(false);

	const { tickets } = useTickets({
		withUnreadMessages: "true"
	});

	const [play] = useSound(alertSound, { volume: volume ?? 1 });
	const soundAlertRef = useRef();

	const historyRef = useRef(history);

	// Detecta se é iOS e PWA
	useEffect(() => {
		const detectDevice = () => {
			const userAgent = navigator.userAgent;
			const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
			const isPWAMode = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
			
			setIsIOS(isIOSDevice);
			setIsPWA(isPWAMode);
			
			console.log('Dispositivo detectado:', {
				isIOS: isIOSDevice,
				isPWA: isPWAMode,
				userAgent: userAgent
			});
		};
		
		detectDevice();
	}, []);

	// Solicitar permissão de notificação otimizada para iOS
	useEffect(() => {
		const requestNotificationPermission = async () => {
			if (!("Notification" in window)) {
				console.log("Este navegador não suporta notificações desktop");
				return;
			}

			console.log("Permissão atual:", Notification.permission);

			if (Notification.permission === "granted") {
				console.log("Permissão já concedida");
				return;
			}

			if (Notification.permission === "denied") {
				console.log("Permissão negada pelo usuário");
				if (isIOS) {
					console.log("Instruções para iOS: Configurações > Safari > Notificações");
				}
				return;
			}

			try {
				const permission = await Notification.requestPermission();
				console.log("Nova permissão:", permission);
				
				if (permission !== "granted") {
					console.log("Permissão para notificações foi negada");
					
					if (isIOS) {
						// Instrução mais detalhada para iOS
						const message = `Para receber notificações no iOS:
1. Vá em Configurações do iOS
2. Role até encontrar este site/Safari
3. Toque em Notificações
4. Ative "Permitir Notificações"
5. ${isPWA ? 'Use o ícone da tela inicial' : 'Adicione este site à tela inicial'}`;
						
						console.log(message);
						// Você pode mostrar um modal com essas instruções
					}
				} else {
					console.log("Permissão concedida! Testando notificação...");
					
					// Teste de notificação
					try {
						const testNotification = new Notification("Notificações ativadas!", {
							body: "Você receberá notificações de novas mensagens",
							icon: defaultLogoFavicon,
							tag: "test-notification",
							requireInteraction: false,
							silent: false
						});
						
						setTimeout(() => {
							testNotification.close();
						}, 3000);
					} catch (notifError) {
						console.error("Erro ao criar notificação de teste:", notifError);
					}
				}
			} catch (error) {
				console.error("Erro ao solicitar permissão:", error);
			}
		};
		
		// Aguarda um pouco antes de solicitar para melhor UX
		const timer = setTimeout(requestNotificationPermission, 1000);
		return () => clearTimeout(timer);
	}, [isIOS, isPWA]);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const setting = await getSetting({
					"column": "showNotificationPending"
				});

				if (setting.showNotificationPending === true) {
					setShowNotificationPending(true);
				}

				if (user.allTicket === "enable") {
					setShowTicketWithoutQueue(true);
				}
				if (user.allowGroup === true) {
					setShowGroupNotification(true);
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchSettings();
	}, [getSetting, user.allTicket, user.allowGroup]);

	useEffect(() => {
		soundAlertRef.current = play;
	}, [play]);

	useEffect(() => {
		const processNotifications = () => {
			setNotifications(tickets);
		};

		processNotifications();
	}, [tickets]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
	}, [ticketIdUrl]);

	useEffect(() => {
		if (!user.id) return;
		
		const companyId = user.companyId;
		
		const onConnectNotificationsPopover = () => {
			console.log("Conectado ao socket para notificações");
			socket.emit("joinNotification");
		};

		const onCompanyTicketNotificationsPopover = (data) => {
			console.log("Evento de ticket recebido:", data);
			
			if (data.action === "updateUnread" || data.action === "delete") {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticketId);
					if (ticketIndex !== -1) {
						prevState.splice(ticketIndex, 1);
						return [...prevState];
					}
					return prevState;
				});

				setDesktopNotifications(prevState => {
					const notificationIndex = prevState.findIndex(
						n => n.tag === String(data.ticketId)
					);
					if (notificationIndex !== -1) {
						prevState[notificationIndex].close();
						prevState.splice(notificationIndex, 1);
						return [...prevState];
					}
					return prevState;
				});
			}
			
			if (data.action === "update" && data.ticket) {
				const { ticket } = data;
				const canUserAccessQueue = user?.queues?.some(queue => queue.id === ticket.queueId);
				const ticketAlreadyInNotifications = notifications.some(t => t.id === ticket.id);
				
				if (
					ticket.queueId && 
					(canUserAccessQueue || (showTicketWithoutQueue === true)) &&
					!ticketAlreadyInNotifications &&
					(!["lgpd", "nps"].includes(ticket.status) || 
					 (ticket.status === "pending" && showNotificationPending === true) ||
					 (ticket.status === "group" && ticket.whatsapp?.groupAsTicket === "enabled" && showGroupNotification === true))
				) {
					setNotifications(prevState => {
						return [ticket, ...prevState];
					});

					const shouldNotNotificate =
						(ticket.id === ticketIdRef.current &&
							document.visibilityState === "visible") ||
						(ticket.userId && ticket.userId !== user?.id) ||
						(ticket.isGroup && ticket.whatsapp?.groupAsTicket === "disabled" && showGroupNotification === false);

					if (!shouldNotNotificate) {
						handleNotifications({
							ticket,
							message: { body: i18n.t("tickets.notification.newTicketQueue") },
							contact: ticket.contact || { name: i18n.t("tickets.notification.unknownContact") }
						});
					}
				}
			}
		};

		const onCompanyAppMessageNotificationsPopover = (data) => {
			console.log("Evento de mensagem recebido:", data);
			
			if (
				data.action === "create" && !data.message.fromMe &&
				!data.message.read &&
				(data.ticket?.userId === user?.id || !data.ticket?.userId) &&
				(user?.queues?.some(queue => (queue.id === data.ticket.queueId)) ||
					!data.ticket.queueId && showTicketWithoutQueue === true) &&
				(!["pending", "lgpd", "nps", "group"].includes(data.ticket?.status) ||
					(data.ticket?.status === "pending" && showNotificationPending === true) ||
					(data.ticket?.status === "group" && data.ticket?.whatsapp?.groupAsTicket === "enabled" && showGroupNotification === true))
			) {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}
					return [data.ticket, ...prevState];
				});

				const shouldNotNotificate =
					(data.message.ticketId === ticketIdRef.current &&
						document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== user?.id) ||
					(data.ticket.isGroup && data.ticket?.whatsapp?.groupAsTicket === "disabled" && showGroupNotification === false);

				if (!shouldNotNotificate) {
					handleNotifications(data);
				}
			}
		};

		socket.on("connect", onConnectNotificationsPopover);
		socket.on(`company-${companyId}-ticket`, onCompanyTicketNotificationsPopover);
		socket.on(`company-${companyId}-appMessage`, onCompanyAppMessageNotificationsPopover);

		return () => {
			socket.off("connect", onConnectNotificationsPopover);
			socket.off(`company-${companyId}-ticket`, onCompanyTicketNotificationsPopover);
			socket.off(`company-${companyId}-appMessage`, onCompanyAppMessageNotificationsPopover);
		};
	}, [
		user, 
		profile, 
		queues, 
		showTicketWithoutQueue, 
		socket, 
		showNotificationPending, 
		showGroupNotification, 
		notifications
	]);

	const handleNotifications = data => {
		const { message, contact, ticket } = data;

		console.log("Processando notificação:", { message, contact, ticket });

		// Verifica suporte a notificações
		if (!("Notification" in window)) {
			console.log("Este navegador não suporta notificações desktop");
			soundAlertRef.current();
			return;
		}

		if (Notification.permission !== "granted") {
			console.log("Permissão de notificação não concedida:", Notification.permission);
			soundAlertRef.current();
			return;
		}

		// Configurações otimizadas para iOS
		const options = {
			body: `${message.body} - ${format(new Date(), "HH:mm")}`,
			icon: contact.urlPicture || defaultLogoFavicon,
			badge: contact.urlPicture || defaultLogoFavicon,
			tag: String(ticket.id),
			renotify: true,
			requireInteraction: isIOS, // Mais agressivo no iOS
			silent: false, // CRÍTICO para áudio
			vibrate: isIOS ? [200, 100, 200] : undefined, // Vibração apenas se suportado
			timestamp: Date.now(),
			data: {
				url: `/tickets/${ticket.uuid}`,
				ticketId: ticket.id,
				timestamp: Date.now()
			},
			// Configurações específicas para iOS
			dir: 'ltr',
			lang: 'pt-BR'
		};

		try {
			console.log("Criando notificação com opções:", options);
			
			const notification = new Notification(
				`${i18n.t("tickets.notification.message")} ${contact.name}`,
				options
			);

			notification.onclick = (event) => {
				console.log("Notificação clicada");
				event.preventDefault();
				window.focus();
				setTabOpen(ticket.status);
				historyRef.current.push(`/tickets/${ticket.uuid}`);
				notification.close();
			};

			notification.onshow = () => {
				console.log("Notificação exibida");
			};

			notification.onerror = (error) => {
				console.error("Erro na notificação:", error);
			};

			notification.onclose = () => {
				console.log("Notificação fechada");
			};

			// Gerenciar lista de notificações ativas
			setDesktopNotifications(prevState => {
				const notificationIndex = prevState.findIndex(
					n => n.tag === notification.tag
				);
				if (notificationIndex !== -1) {
					prevState[notificationIndex].close();
					prevState[notificationIndex] = notification;
					return [...prevState];
				}
				return [notification, ...prevState];
			});

			// Tocar som SEMPRE, independente da configuração da notificação
			soundAlertRef.current();

			// Auto-fechar após um tempo no iOS para economizar recursos
			if (isIOS) {
				setTimeout(() => {
					if (notification) {
						notification.close();
					}
				}, 10000); // 10 segundos
			}

		} catch (err) {
			console.error("Erro ao criar notificação:", err);
			// Em caso de erro, pelo menos tocar o som
			soundAlertRef.current();
		}
	};

	const handleClick = () => {
		setIsOpen(prevState => !prevState);
	};

	const handleClickAway = () => {
		setIsOpen(false);
	};

	const NotificationTicket = ({ children }) => {
		return <div onClick={handleClickAway}>{children}</div>;
	};

	const browserNotification = () => {
		// Atualizar título da página com contador
		if (notifications.length > 0) {
			if (notifications.length < 21) {
				document.title = `(${notifications.length}) ${theme.appName || "App"}`;
			} else {
				document.title = `(${notifications.length}+) ${theme.appName || "App"}`;
			}
		} else {
			document.title = theme.appName || "App";
		}

		return (
			<>
				<Favicon
					animated={notifications.length > 0}
					url={(theme?.appLogoFavicon) ? theme.appLogoFavicon : defaultLogoFavicon}
					alertCount={notifications.length}
					iconSize={195}
				/>
			</>
		);
	};

	return (
		<>
			{browserNotification()}

			<IconButton
				onClick={handleClick}
				ref={anchorEl}
				aria-label="Abrir Notificações"
				color="inherit"
				style={{ color: "white" }}
			>
				<Badge overlap="rectangular" badgeContent={notifications.length} color="secondary">
					<ChatIcon />
				</Badge>
			</IconButton>
			
			<Popover
				disableScrollLock
				open={isOpen}
				anchorEl={anchorEl.current}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				classes={{ paper: classes.popoverPaper }}
				onClose={handleClickAway}
			>
				<List dense className={classes.tabContainer}>
					{isIOS && (
						<ListItem>
							<ListItemText 
								primary="📱 iOS Detectado" 
								secondary={`PWA: ${isPWA ? 'Sim' : 'Não'} | Permissão: ${Notification.permission}`}
							/>
						</ListItem>
					)}
					{notifications.length === 0 ? (
						<ListItem>
							<ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
						</ListItem>
					) : (
						notifications.map(ticket => (
							<NotificationTicket key={ticket.id}>
								<TicketListItemCustom ticket={ticket} isNotification={true} />
							</NotificationTicket>
						))
					)}
				</List>
			</Popover>
		</>
	);
};

export default NotificationsPopOver;