// src/layout/index.js - Versão completa com modal de aniversário
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
  Tooltip, // 🎂 NOVO IMPORT
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import CachedIcon from "@material-ui/icons/Cached";

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

import ColorModeContext from "../layout/themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { getBackendUrl } from "../config";
import useSettings from "../hooks/useSettings";
import VersionControl from "../components/VersionControl";

import { FaGlobe } from "react-icons/fa";
import api from "../services/api"; // 🎂 NOVO IMPORT

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
      color: theme.palette.primary.main,
      border: `1px solid ${theme.palette.primary.main}40`,
      borderRadius: "8px",
      fontWeight: 600,
      textTransform: "none",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: `${theme.palette.primary.main}10`,
        borderColor: theme.palette.primary.main,
        transform: "translateY(-1px)",
        boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
      },
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary.main,
      fontWeight: 700,
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
    background: theme.palette.primary.main,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  },

  // 🎂 NOVO: Toolbar com animação de aniversário
  birthdayToolbar: {
    paddingRight: 24,
    color: theme.palette.dark.main,
    background: "linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff6b6b)",
    backgroundSize: "400% 400%",
    animation: "$gradientShift 3s ease infinite",
    boxShadow: "0 2px 20px rgba(255, 107, 107, 0.5)",
    transition: "all 0.3s ease",
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
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${
      theme.palette.primary.dark || theme.palette.primary.main
    } 100%)`,
    transition: "all 0.3s ease",
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
    fontWeight: 600,
    letterSpacing: "0.025em",
    position: "relative",
    zIndex: 2,
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

  // 🎂 Mais sparkles com pseudo-elementos adicionais
  moreSparkles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
    "&::before": {
      content: '"💫"',
      position: "absolute",
      top: "40%",
      left: "20%",
      fontSize: "1.2rem",
      animation: "$sparkle 2.5s ease-in-out infinite",
      animationDelay: "0.5s",
    },
    "&::after": {
      content: '"🌟"',
      position: "absolute",
      top: "70%",
      right: "25%",
      fontSize: "1rem",
      animation: "$sparkle 2.5s ease-in-out infinite",
      animationDelay: "1.5s",
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
    borderRight: `1px solid ${theme.mode === "light" ? "#e0e0e0" : "#424242"}`,
    boxShadow:
      theme.mode === "light"
        ? "2px 0 8px rgba(0, 0, 0, 0.1)"
        : "2px 0 8px rgba(0, 0, 0, 0.3)",
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
    padding: 0,
    margin: 0,
  },

  container: {
    padding: 0,
    margin: 0,
    maxWidth: "none",
    width: "100%",
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

  NotificationsPopOver: {
    // Mantém original
  },

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
    content:
      "url(" +
      (theme.mode === "light"
        ? theme.calculatedLogoLight()
        : theme.calculatedLogoDark()) +
      ")",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "scale(1.02)",
    },
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
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "scale(1.05)",
      borderColor: theme.palette.primary.main,
    },
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

  toolbarButton: {
    color: "rgba(255, 255, 255, 0.9)",
    borderRadius: "8px",
    padding: "8px",
    margin: "0 2px",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },

  menuButton: {
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "& .MuiSvgIcon-root": {
      transition: "transform 0.3s ease",
    },
    "&:hover .MuiSvgIcon-root": {
      transform: "rotate(90deg)",
    },
  },

  languageSelector: {
    position: "relative",
    display: "inline-block",
    "& > button": {
      background: "rgba(255, 255, 255, 0.1)",
      border: "none",
      borderRadius: "8px",
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: "18px",
      padding: "8px 12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.2)",
        transform: "translateY(-1px)",
      },
    },
    "& > div": {
      position: "absolute",
      top: "35px",
      left: "0",
      background: "#fff",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      borderRadius: "8px",
      padding: "8px",
      zIndex: 1000,
      minWidth: "120px",
      maxWidth: "200px",
      "& button": {
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "block",
        width: "100%",
        padding: "4px",
      },
    },
  },

  animatedBadge: {
    "& .MuiBadge-badge": {
      animation: "$heartbeat 2s infinite",
    },
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

  "@keyframes rainbowText": {
    "0%": { color: "#ff6b6b" },
    "16%": { color: "#feca57" },
    "32%": { color: "#48dbfb" },
    "48%": { color: "#ff9ff3" },
    "64%": { color: "#54a0ff" },
    "80%": { color: "#5f27cd" },
    "100%": { color: "#ff6b6b" }
  },

  // 🎂 NOVAS ANIMAÇÕES
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

 // eslint-disable-next-line react-hooks/exhaustive-deps
const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, socket, handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");

  const [showOptions, setShowOptions] = useState(false);

  // 🎂 NOVOS STATES PARA ANIVERSÁRIO
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [userHasBirthday, setUserHasBirthday] = useState(false);
  const [birthdayData, setBirthdayData] = useState({ users: [], contacts: [], settings: null });

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

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
      toastError("Error checking birthdays:", error);
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
    // ✅ VERIFICAÇÃO ADEQUADA: socket existe E tem os métodos necessários
    if (user?.companyId && socket && typeof socket.on === 'function') {
      const companyId = user.companyId;
  
      const onUserBirthday = (data) => {
        console.log("User birthday event:", data);
        checkTodayBirthdays();
        // 🎂 TOCAR SOM FESTIVO SE FOR ANIVERSÁRIO DO USUÁRIO LOGADO
        if (data.user.id === user.id) {
          playBirthdaySound();
        }
      };
  
      const onContactBirthday = (data) => {
        console.log("Contact birthday event:", data);
        checkTodayBirthdays();
      };
  
      // Adicionar listeners apenas se socket tem os métodos
      try {
        socket.on('user-birthday', onUserBirthday);
        socket.on('contact-birthday', onContactBirthday);
  
        // Cleanup function
        return () => {
          // ✅ VERIFICAÇÃO também no cleanup
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
      };

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

  const handleRefreshPage = () => {
    window.location.reload(false);
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    window.location.reload();
  };

  // 🎂 FUNÇÃO PARA OBTER INICIAIS DO NOME
  const getInitials = (name) => {
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
    <div className={clsx(classes.root, "logged-in-layout")}>
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
          <img
            className={drawerOpen ? classes.logo : classes.hideLogo}
            style={{
              display: "block",
              margin: "0 auto",
              height: "50px",
              width: "100%",
            }}
            alt="logo"
          />
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
          {userHasBirthday && (
            <>
              <div className={classes.sparkles} />
              <div className={classes.moreSparkles} />
            </>
          )}

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

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={userHasBirthday ? classes.birthdayTitle : classes.title}
          >
            {greaterThenSm &&
            user?.profile === "admin" &&
            user?.company?.dueDate ? (
              <>
                {/* 🎂 TEXTO ESPECIAL DE ANIVERSÁRIO */}
                {userHasBirthday ? (
                  <>
                    🎉 PARABÉNS {user.name.toUpperCase()}! HOJE É SEU ANIVERSÁRIO! 🎂
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
                    🎉 PARABÉNS {user.name.toUpperCase()}! HOJE É SEU ANIVERSÁRIO! 🎂
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

          <VersionControl />

          {/* Seletor de idioma */}
          <div
            style={{ position: "relative", display: "inline-block" }}
            className="language-dropdown"
          >
            <button
              onClick={() => setShowOptions(!showOptions)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "22px",
                paddingRight: "20px",
                paddingTop: "8px",
              }}
            >
              <FaGlobe />
            </button>

            {showOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  left: "0",
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  padding: "8px",
                  zIndex: 1000,
                  minWidth: "120px",
                  maxWidth: "200px",
                }}
              >
                <button
                  onClick={() => handleLanguageChange("pt-BR")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    padding: "4px",
                  }}
                >
                  Português
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    padding: "4px",
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange("es")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    padding: "4px",
                  }}
                >
                  Spanish
                </button>
                <button
                  onClick={() => handleLanguageChange("ar")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    padding: "4px",
                  }}
                >
                  عربي
                </button>
              </div>
            )}
          </div>

          <IconButton edge="start" onClick={colorMode.toggleColorMode}>
            {theme.mode === "dark" ? (
              <Brightness7Icon style={{ color: "white" }} />
            ) : (
              <Brightness4Icon style={{ color: "white" }} />
            )}
          </IconButton>

          <NotificationsVolume setVolume={setVolume} volume={volume} />

          <IconButton
            onClick={handleRefreshPage}
            aria-label={i18n.t("mainDrawer.appBar.refresh")}
            color="inherit"
          >
            <CachedIcon style={{ color: "white" }} />
          </IconButton>

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div className="user-menu-wrapper">
            {/* 🎂 TOOLTIP ESPECIAL DE ANIVERSÁRIO */}
            <Tooltip 
              title={userHasBirthday ? "🎉 FELIZ ANIVERSÁRIO! 🎂 Clique para ver seu perfil!" : "Perfil do usuário"}
              arrow
              placement="bottom"
            >
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
                {/* 🎂 AVATAR COM ANIMAÇÃO DE ANIVERSÁRIO SUPER APRIMORADA */}
                <Avatar
                  alt="Multi100"
                  className={userHasBirthday ? classes.birthdayAvatar : classes.avatar2}
                  src={profileUrl}
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
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
                  animation: `${classes["@keyframes rainbowText"]} 3s infinite`
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
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;