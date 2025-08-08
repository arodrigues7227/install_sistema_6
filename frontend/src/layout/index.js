import React, { useState, useContext, useEffect, useMemo } from "react";
import clsx from "clsx";

import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  withStyles,
  Chip,
  Tooltip,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import CachedIcon from "@material-ui/icons/Cached";
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import WhatsAppIcon from "@material-ui/icons/WhatsApp";

import BackupModal from "../components/BackupModal";
import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import BirthdayModal from "../components/BirthdayModal"; // 🎂 NOVO IMPORT
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import logo from "../assets/logo.png";
import logoDark from "../assets/logo-black.png";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import UserLanguageSelector from "../components/UserLanguageSelector";

import ColorModeContext from "./themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { getBackendUrl } from "../config";
import useSettings from "../hooks/useSettings";
import VersionControl from "../components/VersionControl";
import api from "../services/api";
import { Link } from "react-router-dom";

const backendUrl = getBackendUrl();

const drawerWidth = 240;

// Estilos atualizados com animação de aniversário
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary,
      border:
        theme.mode === "light"
          ? "1px solid rgba(0 124 102)"
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
  },

  chip: {
    background: "red",
    color: "white",
  },

  avatar: {
    width: "100%",
  },

  toolbar: {
    paddingRight: 24,
    color: theme.palette.dark.main,
    background: theme.palette.barraSuperior,
  },

  // 🎂 NOVO: Toolbar com animação de aniversário
  birthdayToolbar: {
    paddingRight: 24,
    color: theme.palette.dark.main,
    background: "linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff6b6b)",
    backgroundSize: "400% 400%",
    animation: "$gradientShift 3s ease infinite",
    boxShadow: "0 2px 20px rgba(255, 107, 107, 0.5)",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
      opacity: 0.3,
      animation: "$float 4s ease-in-out infinite",
    },
    "&::after": {
      content: '"🎉🎂🎈🎊"',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "2rem",
      opacity: 0.1,
      animation: "$rotate 10s linear infinite",
      pointerEvents: "none",
    }
  },

  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 8px",
    minHeight: "48px",
    [theme.breakpoints.down("sm")]: {
      height: "48px",
    },
  },

  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },

  menuButtonHidden: {
    display: "none",
  },

  title: {
    flexGrow: 1,
    fontSize: 14,
    color: "white",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // 🎂 NOVO: Título com animação de aniversário
  birthdayTitle: {
    flexGrow: 1,
    fontSize: 14,
    color: "white",
    fontWeight: 700,
    letterSpacing: "0.025em",
    position: "relative",
    zIndex: 2,
    textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)",
    animation: "$titleGlow 2s ease-in-out infinite alternate",
    "&::before": {
      content: '"🎉 "',
      animation: "$bounce 1s infinite",
      display: "inline-block",
    },
    "&::after": {
      content: '" 🎂"',
      animation: "$bounce 1.5s infinite",
      display: "inline-block",
    }
  },

  // 🎂 NOVO: Confetes caindo
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 1,
    "&::before, &::after": {
      content: '"🎊🎉🎈🎁✨🌟💫⭐"',
      position: "absolute",
      top: "-10px",
      left: 0,
      right: 0,
      fontSize: "1.2rem",
      letterSpacing: "2rem",
      animation: "$confettiFall 8s linear infinite",
      opacity: 0.6,
    },
    "&::after": {
      animationDelay: "4s",
      fontSize: "0.8rem",
      letterSpacing: "1.5rem",
    }
  },

  // 🎂 NOVO: Badge de aniversário animado
  birthdayBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    color: "white",
    borderRadius: "50%",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    animation: "$heartbeat 1.5s infinite",
    zIndex: 3,
    border: "2px solid white",
    boxShadow: "0 0 10px rgba(255, 68, 68, 0.5)",
  },

  // 🎂 NOVO: Container do avatar de aniversário
  birthdayAvatarContainer: {
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: -8,
      left: -8,
      right: -8,
      bottom: -8,
      borderRadius: "50%",
      background: "linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff6b6b)",
      backgroundSize: "400% 400%",
      animation: "$gradientShift 2s ease infinite",
      zIndex: 0,
    },
    "&::after": {
      content: '"🎂"',
      position: "absolute",
      top: -15,
      right: -10,
      fontSize: "20px",
      animation: "$floatEmoji 3s ease-in-out infinite",
      zIndex: 4,
    }
  },

  // 🎂 NOVO: Efeitos de brilho/sparkle
  sparkles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
    "&::before": {
      content: '"✨"',
      position: "absolute",
      top: "20%",
      left: "10%",
      fontSize: "1rem",
      animation: "$sparkle 2s ease-in-out infinite",
      animationDelay: "0s",
    },
    "&::after": {
      content: '"⭐"',
      position: "absolute",
      top: "60%",
      right: "15%",
      fontSize: "0.8rem",
      animation: "$sparkle 2s ease-in-out infinite",
      animationDelay: "1s",
    }
  },

  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    overflowY: "hidden",
  },

  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },

  appBarSpacer: {
    minHeight: "48px",
  },

  content: {
    flex: 1,
    overflow: "auto",
  },

  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },

  containerWithScroll: {
    flex: 1,
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    borderRadius: "8px",
    border: "2px solid transparent",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    "-ms-overflow-style": "none",
    "scrollbar-width": "none",
  },

  NotificationsPopOver: {},

  logo: {
    width: "100%",
    height: "45px",
    maxWidth: 180,
    [theme.breakpoints.down("sm")]: {
      width: "auto",
      height: "100%",
      maxWidth: 180,
    },
    logo: theme.logo,
    content: "url(" + (theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")"
  },

  hideLogo: {
    display: "none",
  },

  avatar2: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: "pointer",
    borderRadius: "50%",
    border: "2px solid #ccc",
  },

  // 🎂 NOVO: Avatar com animação de aniversário
  birthdayAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: "pointer",
    borderRadius: "50%",
    background: "linear-gradient(45deg, #ff6b6b, #feca57)",
    border: "3px solid #fff",
    position: "relative",
    animation: "$birthdayPulse 2s infinite",
    boxShadow: "0 0 20px rgba(255, 107, 107, 0.5)",
    "&::before": {
      content: '"🎉"',
      position: "absolute",
      top: -5,
      right: -5,
      fontSize: 12,
      animation: "$bounce 1s infinite",
    },
    "&:hover": {
      transform: "scale(1.05)",
    },
  },

  updateDiv: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  ticketIcon: {
    color: "white",
  },

  desktopIcon: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },

  mobileIconsContainer: {
    display: 'flex',
    marginLeft: 'auto',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  // 🎂 NOVAS ANIMAÇÕES FESTIVAS
  "@keyframes gradientShift": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" }
  },

  "@keyframes titleGlow": {
    "0%": { 
      textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)",
      transform: "scale(1)"
    },
    "100%": { 
      textShadow: "0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5)",
      transform: "scale(1.02)"
    }
  },

  "@keyframes confettiFall": {
    "0%": { 
      transform: "translateY(-100px) rotate(0deg)",
      opacity: 1
    },
    "100%": { 
      transform: "translateY(100px) rotate(360deg)",
      opacity: 0
    }
  },

  "@keyframes float": {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-10px)" }
  },

  "@keyframes rotate": {
    "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
    "100%": { transform: "translate(-50%, -50%) rotate(360deg)" }
  },

  "@keyframes floatEmoji": {
    "0%, 100%": { 
      transform: "translateY(0px) rotate(-5deg)",
      opacity: 1
    },
    "50%": { 
      transform: "translateY(-8px) rotate(5deg)",
      opacity: 0.8
    }
  },

  "@keyframes sparkle": {
    "0%, 100%": { 
      transform: "scale(0) rotate(0deg)",
      opacity: 0
    },
    "50%": { 
      transform: "scale(1) rotate(180deg)",
      opacity: 1
    }
  },

  "@keyframes birthdayPulse": {
    "0%, 100%": { 
      transform: "scale(1)",
      boxShadow: "0 0 20px rgba(255, 107, 107, 0.5)"
    },
    "50%": { 
      transform: "scale(1.1)",
      boxShadow: "0 0 30px rgba(255, 107, 107, 0.8)"
    }
  },

  "@keyframes bounce": {
    "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
    "40%": { transform: "translateY(-5px)" },
    "60%": { transform: "translateY(-3px)" }
  },

  "@keyframes heartbeat": {
    "0%": { transform: "scale(1)" },
    "14%": { transform: "scale(1.1)" },
    "28%": { transform: "scale(1)" },
    "42%": { transform: "scale(1.1)" },
    "70%": { transform: "scale(1)" },
  },
}));

const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}))(Badge);

const SmallAvatar = withStyles((theme) => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`,
  },
}))(Avatar);

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const [userToken, setUserToken] = useState("disabled");
  const [loadingUserToken, setLoadingUserToken] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user, socket } = useContext(AuthContext);
  const [backupUrl, setBackupUrl] = useState(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // 🎂 NOVOS STATES PARA ANIVERSÁRIO
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [userHasBirthday, setUserHasBirthday] = useState(false);
  const [birthdayData, setBirthdayData] = useState({ users: [], contacts: [], settings: null });
  
  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const { dateToClient } = useDate();
  const [profileUrl, setProfileUrl] = useState(null);

  const mainListItems = useMemo(
    () => <MainListItems drawerOpen={drawerOpen} collapsed={!drawerOpen} />,
    [user, drawerOpen]
  );

  const settings = useSettings();

  // 🎂 FUNÇÃO PARA VERIFICAR SE JÁ MOSTROU O MODAL HOJE
  const hasShownBirthdayModalToday = () => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(`lastBirthdayModalShown_${user?.id}`);
    return lastShown === today;
  };

  // 🎂 FUNÇÃO PARA MARCAR QUE O MODAL FOI MOSTRADO HOJE
  const markBirthdayModalShown = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`lastBirthdayModalShown_${user?.id}`, today);
  };

  // 🎂 FUNÇÃO PARA VERIFICAR ANIVERSÁRIOS
  const checkTodayBirthdays = async () => {
    try {
      const { data } = await api.get("/birthdays/today");
      const birthdayInfo = data.data;
      
      setBirthdayData(birthdayInfo);
      
      // Verificar se o usuário logado faz aniversário hoje
      const userBirthday = birthdayInfo.users.find(u => u.id === user.id);
      setUserHasBirthday(!!userBirthday);
      
      // Abrir modal se há aniversariantes E se ainda não foi mostrado hoje para este usuário
      const hasBirthdays = birthdayInfo.users.length > 0 || birthdayInfo.contacts.length > 0;
      if (hasBirthdays && !hasShownBirthdayModalToday()) {
        // Delay para dar tempo do layout carregar
        setTimeout(() => {
          setBirthdayModalOpen(true);
          markBirthdayModalShown(); // Marcar que foi mostrado
          
          // 🎂 TOCAR SOM FESTIVO SE HOUVER ANIVERSARIANTES
          if (birthdayInfo.users.some(u => u.id === user.id)) {
            playBirthdaySound();
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error checking birthdays:", error);
    }
  };

  // 🎂 FUNÇÃO PARA TOCAR SOM FESTIVO (OPCIONAL)
  const playBirthdaySound = () => {
    try {
      // Criar sequência de tons festivos usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Sequência de notas "Happy Birthday" simplificada
      const notes = [
        { freq: 261.63, duration: 0.3 }, // C
        { freq: 293.66, duration: 0.3 }, // D
        { freq: 329.63, duration: 0.6 }, // E
        { freq: 261.63, duration: 0.3 }, // C
        { freq: 349.23, duration: 0.6 }, // F
        { freq: 329.63, duration: 1.0 }  // E
      ];

      let currentTime = audioContext.currentTime;
      
      notes.forEach((note, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(note.freq, currentTime);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.1, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        currentTime += note.duration + 0.1;
      });
      
    } catch (error) {
      console.log('Som de aniversário não disponível:', error);
    }
  };

  // 🎂 EFEITO PARA VERIFICAR ANIVERSÁRIOS AO FAZER LOGIN
  useEffect(() => {
    if (user?.id) {
      checkTodayBirthdays();
    }
  }, [user]);

  // 🎂 LISTENER PARA EVENTOS DE ANIVERSÁRIO VIA SOCKET
  useEffect(() => {
    if (user?.companyId && socket && typeof socket.on === 'function') {
      const companyId = user.companyId;
  
      const onUserBirthday = (data) => {
        console.log("User birthday event:", data);
        checkTodayBirthdays();
        if (data.user.id === user.id) {
          playBirthdaySound();
        }
      };
  
      const onContactBirthday = (data) => {
        console.log("Contact birthday event:", data);
        checkTodayBirthdays();
      };
  
      try {
        socket.on('user-birthday', onUserBirthday);
        socket.on('contact-birthday', onContactBirthday);
  
        return () => {
          if (socket && typeof socket.off === 'function') {
            socket.off('user-birthday', onUserBirthday);
            socket.off('contact-birthday', onContactBirthday);
          }
        };
      } catch (error) {
        console.error('Erro ao adicionar listeners de aniversário:', error);
      }
    }
  }, [user, socket]);

  useEffect(() => {
    if (document.body.offsetWidth > 600) {
      if (user.defaultMenu === "closed") {
        setDrawerOpen(false);
      } else {
        setDrawerOpen(true);
      }
    }
    if (user.defaultTheme === "dark" && theme.mode === "light") {
      colorMode.toggleColorMode();
    }
  }, [user.defaultMenu, document.body.offsetWidth]);

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

  useEffect(() => {
    const companyId = user.companyId;
    const userId = user.id;
    if (companyId) {
      const ImageUrl = user.profileImage;
      if (ImageUrl !== undefined && ImageUrl !== null)
        setProfileUrl(
          `${backendUrl}/public/company${companyId}/user/${ImageUrl}`
        );
      else setProfileUrl(`${process.env.FRONTEND_URL}/nopicture.png`);

      const onCompanyAuthLayout = (data) => {
        if (data.user.id === +userId) {
          toastError("Sua conta foi acessada em outro computador.");
          setTimeout(() => {
            localStorage.clear();
            window.location.reload();
          }, 1000);
        }
      }

      socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

      socket.emit("userStatus");
      const interval = setInterval(() => {
        socket.emit("userStatus");
      }, 1000 * 60 * 5);

      return () => {
        socket.off(`company-${companyId}-auth`, onCompanyAuthLayout);
        clearInterval(interval);
      };
    }
  }, [socket]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600 || user.defaultMenu === "closed") {
      setDrawerOpen(false);
    }
  };

  // Função para abrir o modal de backup
  const handleOpenBackupModal = () => {
    setBackupModalOpen(true);
  };

  // Função para fechar o modal de backup
  const handleCloseBackupModal = () => {
    setBackupModalOpen(false);
  };

  const handleRefreshPage = () => {
    window.location.reload(false);
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  // Função para executar o backup
  const handleBackup = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await api.get(`${backendUrl}/api/backup`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      let fileName = "backup.zip";
      
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)$/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].trim();
          if (!fileName.toLowerCase().endsWith('.zip')) {
            fileName += '.zip';
          }
        }
      }

      setBackupUrl({ url, fileName });
      handleOpenBackupModal();
    } catch (error) {
      console.log(error);
      toastError("Erro ao gerar backup");
    }
  };

  // 🎂 FUNÇÃO PARA OBTER INICIAIS DO NOME
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      {/* 🎂 MODAL DE ANIVERSÁRIO */}
      <BirthdayModal
        open={birthdayModalOpen}
        onClose={() => setBirthdayModalOpen(false)}
        user={user}
      />

      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          ),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon}>
          <img className={drawerOpen ? classes.logo : classes.hideLogo}
            style={{
              display: "block",
              margin: "0 auto",
              height: "50px",
              width: "100%",
            }}
            alt="logo" />
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <List className={classes.containerWithScroll}>
          <MainListItems collapsed={!drawerOpen} />
        </List>
        <Divider />
      </Drawer>

      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar 
          variant="dense" 
          className={userHasBirthday ? classes.birthdayToolbar : classes.toolbar}
        >
          {/* 🎂 NOVO: Confetes caindo se for aniversário */}
          {userHasBirthday && <div className={classes.confetti} />}
          
          {/* 🎂 NOVO: Brilhos/Sparkles se for aniversário */}
          {userHasBirthday && <div className={classes.sparkles} />}

          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            style={{ color: "white" }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(drawerOpen && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>

          {/* Só exibe o título em dispositivos não móveis */}
          {greaterThenSm && (
            <Typography
              component="h2"
              variant="h6"
              color="inherit"
              noWrap
              className={userHasBirthday ? classes.birthdayTitle : classes.title}
            >
              {user?.profile === "admin" && user?.company?.dueDate ? (
                <>
                  {/* 🎂 TEXTO ESPECIAL DE ANIVERSÁRIO */}
                  {userHasBirthday ? (
                    <>
                      PARABÉNS {user.name.toUpperCase()}! HOJE É SEU ANIVERSÁRIO!
                    </>
                  ) : (
                    <>
                      {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                      {i18n.t("mainDrawer.appBar.user.messageEnd")}{" "}
                      <b>{user?.company?.name}</b>! (
                      {i18n.t("mainDrawer.appBar.user.active")}{" "}
                      {dateToClient(user?.company?.dueDate)})
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* 🎂 TEXTO ESPECIAL DE ANIVERSÁRIO PARA NÃO ADMIN */}
                  {userHasBirthday ? (
                    <>
                      PARABÉNS {user.name.toUpperCase()}! HOJE É SEU ANIVERSÁRIO!
                    </>
                  ) : (
                    <>
                      {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                      {i18n.t("mainDrawer.appBar.user.messageEnd")}{" "}
                      <b>{user?.company?.name}</b>!
                    </>
                  )}
                </>
              )}
            </Typography>
          )}

          {/* Container para ícones em dispositivos móveis */}
          {isMobile && (
            <div className={classes.mobileIconsContainer}>
              {/* Botão que leva para tela de atendimento (mobile) */}
              <Tooltip title={i18n.t("mainDrawer.listItems.tickets")}>
                <IconButton
                  component={Link}
                  to="/tickets"
                  aria-label={i18n.t("mainDrawer.listItems.tickets")}
                  color="inherit"
                >
                  <WhatsAppIcon className={classes.ticketIcon} />
                </IconButton>
              </Tooltip>

              {/* Seletor de tema escuro/claro */}
              <Tooltip title={theme.mode === "dark" ? "Modo claro" : "Modo escuro"}>
                <IconButton edge="start" onClick={colorMode.toggleColorMode}>
                  {theme.mode === "dark" ? (
                    <Brightness7Icon style={{ color: "white" }} />
                  ) : (
                    <Brightness4Icon style={{ color: "white" }} />
                  )}
                </IconButton>
              </Tooltip>
              
              {/* Seletor de idioma com ícone melhor */}
              <Tooltip title={i18n.t("mainDrawer.appBar.user.language") || "Idioma"}>
                <div>
          {/* Seletor de idioma (apenas ícone) */}
          <UserLanguageSelector iconOnly={true} />
                </div>
              </Tooltip>
              
              {/* Adicione o controle de volume em mobile */}
              <Tooltip title={i18n.t("mainDrawer.appBar.volume") || "Volume"}>
                <div>
                  <NotificationsVolume setVolume={setVolume} volume={volume} />
                </div>
              </Tooltip>
                            
              {/* Notificações */}
              {user.id && <NotificationsPopOver volume={volume} />}
              
              {/* Perfil do usuário */}
              <Tooltip title={userHasBirthday ? "🎉 FELIZ ANIVERSÁRIO! 🎂 Clique para ver seu perfil!" : "Perfil do usuário"}>
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  variant="dot"
                  onClick={handleMenu}
                  className={userHasBirthday ? classes.birthdayAvatarContainer : ""}
                >
                  <Avatar
                    alt="Multi100"
                    className={userHasBirthday ? classes.birthdayAvatar : classes.avatar2}
                    src={profileUrl}
                  >
                    {!profileUrl && getInitials(user.name)}
                  </Avatar>
                  
                  {/* 🎂 BADGE DE ANIVERSÁRIO */}
                  {userHasBirthday && (
                    <div className={classes.birthdayBadge}>
                      🎂
                    </div>
                  )}
                </StyledBadge>
              </Tooltip>
            </div>
          )}

          {userToken === "enabled" && user?.companyId === 1 && (
            <Chip
              className={classes.chip}
              label={i18n.t("mainDrawer.appBar.user.token")}
            />
          )}
          
          {/* Version control só visível em desktop */}
          {greaterThenSm && <VersionControl />}

          {user.profile === "admin" && user?.companyId === 1 && !isMobile && (
            <Tooltip title={i18n.t("mainDrawer.appBar.backup") || "Backup"}>
              <IconButton
                onClick={handleBackup}
                aria-label={i18n.t("mainDrawer.appBar.backup") || "Backup"}
                color="inherit"
                className={classes.desktopIcon}
              >
                <CloudDownloadIcon style={{ color: "white" }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Desktop: ícones e botões normais */}
          {!isMobile && (
            <>
              {/* Seletor de idioma (apenas ícone) */}
              <Tooltip title={i18n.t("mainDrawer.appBar.user.language") || "Idioma"}>
                <div>
                  <UserLanguageSelector iconOnly={true} />
                </div>
              </Tooltip>

              <Tooltip title={theme.mode === "dark" ? "Modo claro" : "Modo escuro"}>
                <IconButton edge="start" onClick={colorMode.toggleColorMode}>
                  {theme.mode === "dark" ? (
                    <Brightness7Icon style={{ color: "white" }} />
                  ) : (
                    <Brightness4Icon style={{ color: "white" }} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title={i18n.t("mainDrawer.appBar.volume") || "Volume"}>
                <div>
                  <NotificationsVolume setVolume={setVolume} volume={volume} />
                </div>
              </Tooltip>

              <Tooltip title={i18n.t("mainDrawer.appBar.refresh")}>
                <IconButton
                  onClick={handleRefreshPage}
                  aria-label={i18n.t("mainDrawer.appBar.refresh")}
                  color="inherit"
                  className={classes.desktopIcon}
                >
                  <CachedIcon style={{ color: "white" }} />
                </IconButton>
              </Tooltip>

              {/* Notificações (visível em mobile e desktop) */}
              {user.id && <NotificationsPopOver volume={volume} />}

              {/* Componentes visíveis apenas em desktop */}
              <AnnouncementsPopover />
              
              <ChatPopover />

              <Tooltip title={userHasBirthday ? "🎉 FELIZ ANIVERSÁRIO! 🎂 Clique para ver seu perfil!" : "Perfil do usuário"}>
                <div>
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    variant="dot"
                    onClick={handleMenu}
                    className={userHasBirthday ? classes.birthdayAvatarContainer : ""}
                  >
                    <Avatar
                      alt="Multi100"
                      className={userHasBirthday ? classes.birthdayAvatar : classes.avatar2}
                      src={profileUrl}
                    >
                      {!profileUrl && getInitials(user.name)}
                    </Avatar>
                    
                    {/* 🎂 BADGE DE ANIVERSÁRIO */}
                    {userHasBirthday && (
                      <div className={classes.birthdayBadge}>
                        🎂
                      </div>
                    )}
                  </StyledBadge>
                </div>
              </Tooltip>
            </>
          )}

          <UserModal
            open={userModalOpen}
            onClose={() => setUserModalOpen(false)}
            onImageUpdate={(newProfileUrl) => setProfileUrl(newProfileUrl)}
            userId={user?.id}
          />

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={menuOpen}
            onClose={handleCloseMenu}
            PaperProps={{
              style: {
                minWidth: "150px",
                maxWidth: "200px",
                width: "auto",
                // 🎂 MENU COM DECORAÇÃO DE ANIVERSÁRIO
                ...(userHasBirthday && {
                  background: "linear-gradient(135deg, #ff6b6b22, #feca5722, #48dbfb22)",
                  border: "2px solid #ff6b6b55",
                  boxShadow: "0 8px 32px rgba(255, 107, 107, 0.3)",
                })
              },
            }}
          >
            {/* 🎂 ITEM DE MENU ESPECIAL PARA ANIVERSÁRIO */}
            {userHasBirthday && (
              <MenuItem disabled style={{ 
                justifyContent: "center", 
                color: theme.palette.primary.main,
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}>
                🎉 FELIZ ANIVERSÁRIO! 🎂
              </MenuItem>
            )}
            
            <MenuItem onClick={handleOpenUserModal}>
              {userHasBirthday && "🎁 "}
              {i18n.t("mainDrawer.appBar.user.profile")}
            </MenuItem>
            <MenuItem onClick={handleClickLogout}>
              {i18n.t("mainDrawer.appBar.user.logout")}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <BackupModal
        open={backupModalOpen}
        onClose={handleCloseBackupModal}
        backupUrl={backupUrl}
      />

      <main className={classes.content}>
        <div className={classes.appBarSpacer} />

        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;