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

	const { tickets } = useTickets({
		withUnreadMessages: "true"
	});

	const [play] = useSound(alertSound, { volume: volume ?? 1 });
	const soundAlertRef = useRef();

	const historyRef = useRef(history);

	// Solicitar permissão de notificação no carregamento do componente
	useEffect(() => {
		const requestNotificationPermission = async () => {
			if ("Notification" in window) {
				const permission = await Notification.requestPermission();
				if (permission !== "granted") {
					console.log("Permissão para notificações foi negada");
				}
			} else {
				console.log("Este navegador não suporta notificações desktop");
			}
		};
		
		requestNotificationPermission();
	}, []);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const setting = await getSetting(
					{
						"column": "showNotificationPending"
					}
				);

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
		}

		fetchSettings();
	}, [getSetting, user.allTicket, user.allowGroup]);

	useEffect(() => {
		soundAlertRef.current = play;
	}, [play]);

	useEffect(() => {
		const processNotifications = () => {
			setNotifications(tickets);
		}

		processNotifications();
	}, [tickets]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
	}, [ticketIdUrl]);

	useEffect(() => {
		if (!user.id) return;
		
		const companyId = user.companyId;
		
		const onConnectNotificationsPopover = () => {
			socket.emit("joinNotification");
		}

		const onCompanyTicketNotificationsPopover = (data) => {
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
					const notfiticationIndex = prevState.findIndex(
						n => n.tag === String(data.ticketId)
					);
					if (notfiticationIndex !== -1) {
						prevState[notfiticationIndex].close();
						prevState.splice(notfiticationIndex, 1);
						return [...prevState];
					}
					return prevState;
				});
			}
			
			// Nova lógica para notificar quando um ticket for atribuído a uma fila
			if (data.action === "update" && data.ticket) {
				const { ticket } = data;
				// Verificar se o ticket tem uma fila que o usuário pode acessar
				const canUserAccessQueue = user?.queues?.some(queue => queue.id === ticket.queueId);
				
				// Verificar se o ticket já está nas notificações
				const ticketAlreadyInNotifications = notifications.some(t => t.id === ticket.id);
				
				// Condições para notificar:
				// 1. O ticket tem uma fila (queueId)
				// 2. A fila está entre as filas do usuário OU o usuário pode ver tickets sem fila
				// 3. O ticket ainda não está nas notificações
				// 4. O status do ticket é apropriado para notificação
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

					// Não notificar se o ticket já estiver aberto e visível
					const shouldNotNotificate =
						(ticket.id === ticketIdRef.current &&
							document.visibilityState === "visible") ||
						(ticket.userId && ticket.userId !== user?.id) ||
						(ticket.isGroup && ticket.whatsapp?.groupAsTicket === "disabled" && showGroupNotification === false);

					if (shouldNotNotificate === true) return;

					handleNotifications({
						ticket,
						message: { body: i18n.t("tickets.notification.newTicketQueue") },
						contact: ticket.contact || { name: i18n.t("tickets.notification.unknownContact") }
					});
				}
			}
		};

		const onCompanyAppMessageNotificationsPopover = (data) => {
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

				if (shouldNotNotificate === true) return;

				handleNotifications(data);
			}
		}

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

		// Garantir que a notificação só será exibida se o navegador suportar e a permissão estiver concedida
		if (!("Notification" in window)) {
			console.log("Este navegador não suporta notificações desktop");
			soundAlertRef.current();
			return;
		}

		if (Notification.permission !== "granted") {
			// Se a permissão não estiver concedida, apenas tocar o som
			soundAlertRef.current();
			return;
		}

		// Configurações da notificação
		const options = {
			body: `${message.body} - ${format(new Date(), "HH:mm")}`,
			icon: contact.urlPicture || defaultLogoFavicon,
			tag: String(ticket.id),
			renotify: true,
			requireInteraction: false,
			silent: true, // Silenciar a notificação para usar nosso próprio som
			data: {
				url: `/tickets/${ticket.uuid}`
			}
		};

		try {
			const notification = new Notification(
				`${i18n.t("tickets.notification.message")} ${contact.name}`,
				options
			);

			notification.onclick = () => {
				window.focus();
				setTabOpen(ticket.status);
				historyRef.current.push(`/tickets/${ticket.uuid}`);
				notification.close();
			};

			setDesktopNotifications(prevState => {
				const notificationIndex = prevState.findIndex(
					n => n.tag === notification.tag
				);
				if (notificationIndex !== -1) {
					prevState[notificationIndex] = notification;
					return [...prevState];
				}
				return [notification, ...prevState];
			});

			// Tocar o som de alerta explicitamente, independente da configuração silent da notificação
			soundAlertRef.current();
		} catch (err) {
			console.error("Erro ao criar notificação:", err);
			// Em caso de erro na criação da notificação, pelo menos tocamos o som
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
		const numbers = "⓿➊➋➌➍➎➏➐➑➒➓⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴";
		if (notifications.length > 0) {
      if (notifications.length < 21) {
        document.title = (theme.appName || "...");
      } else {
        document.title = "(" + notifications.length + ")" + (theme.appName || "...");
      }
    } else {
      document.title = theme.appName || "...";
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
				aria-label="Open Notifications"
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