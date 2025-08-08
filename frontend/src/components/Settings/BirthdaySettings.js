import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/Auth/AuthContext";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  IconButton,
  Collapse
} from "@material-ui/core";
import {
  Cake as CakeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  Telegram as TelegramIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon
} from "@material-ui/icons";

import Title from "../../components/Title";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3)
  },
    mainPaper: {
    flex: 1,
    padding: 0,
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: 600
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    flexDirection: "column"
  },
  errorContainer: {
    marginBottom: theme.spacing(2)
  },
  debugContainer: {
    backgroundColor: "#f5f5f5",
    padding: theme.spacing(2),
    borderRadius: 8,
    marginBottom: theme.spacing(2),
    fontFamily: "monospace",
    fontSize: "0.8rem"
  },
  saveButton: {
    background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
    color: "white",
    fontWeight: 600,
    textTransform: "none",
    borderRadius: 8,
    padding: theme.spacing(1, 3),
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)"
    }
  },
  refreshButton: {
    background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
    color: "white",
    fontWeight: 600,
    textTransform: "none",
    borderRadius: 8,
    marginLeft: theme.spacing(1)
  },
  expandButton: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest
    })
  },
  expandButtonOpen: {
    transform: "rotate(180deg)"
  }
}));

const BirthdaySettings = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    user: true,
    contact: true,
    general: true
  });

  const addDebugInfo = (info) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
    console.log(`🐛 [DEBUG] ${info}`);
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    addDebugInfo("🔍 Iniciando busca de configurações...");
    
    try {
      // Debug: Verificar contexto do usuário
      addDebugInfo(`👤 Usuário logado: ${user?.name} (ID: ${user?.id}, Company: ${user?.companyId})`);
      addDebugInfo(`🔑 Token presente: ${!!localStorage.getItem('token')}`);
      
      // Debug: Verificar URL base da API
      addDebugInfo(`🌐 URL da API: ${api.defaults.baseURL || 'não definida'}`);
      
      addDebugInfo("📡 Fazendo requisição GET /birthdays/settings...");
      
      const { data } = await api.get("/birthdays/settings");
      
      addDebugInfo(`✅ Resposta recebida: ${JSON.stringify(data, null, 2)}`);
      
      // Verificar estrutura da resposta
      const settingsData = data?.data || data || {};
      addDebugInfo(`📝 Dados extraídos: ${JSON.stringify(settingsData, null, 2)}`);
      
      setSettings(settingsData);
      addDebugInfo("✅ Configurações carregadas com sucesso!");
      
    } catch (error) {
      addDebugInfo(`❌ Erro na requisição: ${error.message}`);
      addDebugInfo(`📊 Status: ${error.response?.status}`);
      addDebugInfo(`📄 Dados: ${JSON.stringify(error.response?.data, null, 2)}`);
      addDebugInfo(`🔗 URL completa: ${error.config?.url}`);
      addDebugInfo(`🎯 Headers: ${JSON.stringify(error.config?.headers, null, 2)}`);
      
      console.error("Erro completo:", error);
      
      // Tratamento específico de erros
      if (error.response?.status === 404) {
        setError("❌ Rota /birthdays/settings não encontrada no backend. Verifique se as rotas estão registradas.");
      } else if (error.response?.status === 401) {
        setError("🔐 Não autorizado. Token JWT pode estar inválido ou expirado.");
      } else if (error.response?.status >= 500) {
        setError("🛠️ Erro interno do servidor. Verifique logs do backend.");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError("🌐 Erro de rede. Verifique se o backend está rodando.");
      } else {
        setError(`🚨 Erro: ${error.message}`);
      }
      
      toast.error("Erro ao carregar configurações de aniversário");
      
      // Dados padrão para teste
      setSettings({
        userBirthdayEnabled: true,
        contactBirthdayEnabled: false,
        createAnnouncementForUsers: false,
        userBirthdayMessage: "🎉 Parabéns {nome}! Hoje é seu aniversário! 🎂",
        contactBirthdayMessage: "🎉 Parabéns {nome}! Hoje você completa {idade} anos! 🎂",
        sendBirthdayTime: "09:00:00"
      });
      
    } finally {
      setLoading(false);
      addDebugInfo("🏁 Busca de configurações finalizada");
    }
  };

  useEffect(() => {
    addDebugInfo("🚀 Componente BirthdaySettings montado");
    fetchSettings();
  }, []);

  const handleSettingChange = (field, value) => {
    addDebugInfo(`📝 Alterando configuração: ${field} = ${value}`);
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    addDebugInfo("💾 Iniciando salvamento...");
    
    try {
      addDebugInfo(`📤 Enviando dados: ${JSON.stringify(settings, null, 2)}`);
      
      const { data } = await api.put("/birthdays/settings", settings);
      
      addDebugInfo(`✅ Resposta do salvamento: ${JSON.stringify(data, null, 2)}`);
      
      toast.success("Configurações de aniversário salvas com sucesso! 🎉");
      setError(null);
      
    } catch (error) {
      addDebugInfo(`❌ Erro no salvamento: ${error.message}`);
      addDebugInfo(`📊 Status: ${error.response?.status}`);
      addDebugInfo(`📄 Dados do erro: ${JSON.stringify(error.response?.data, null, 2)}`);
      
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
      
      if (error.response?.status === 404) {
        setError("❌ Rota PUT /birthdays/settings não encontrada no backend.");
      }
      
    } finally {
      setSaving(false);
      addDebugInfo("🏁 Salvamento finalizado");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <Box className={classes.root}>
        <div className={classes.loadingContainer}>
          <CircularProgress size={60} />
          <Typography variant="h6" style={{ marginTop: 16 }}>
            Carregando configurações de aniversário...
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            {debugInfo.split('\n').pop()} {/* Mostra última linha do debug */}
          </Typography>
        </div>
      </Box>
    );
  }

  return (
        <MainContainer>
      <MainHeader>
        <Title>🎂 Configurações de Aniversário</Title>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
    <Box className={classes.root}>
      {/* Header com botões de ação */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" gutterBottom>
          🎂 Configurações de Aniversário
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<BugIcon />}
            onClick={() => setShowDebug(!showDebug)}
            style={{ marginRight: 8 }}
          >
            Debug
          </Button>
          <Button
            variant="contained"
            className={classes.refreshButton}
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Debug Container */}
      <Collapse in={showDebug}>
        <Paper className={classes.debugContainer}>
          <Typography variant="h6" gutterBottom>
            🐛 Informações de Debug
          </Typography>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {debugInfo || "Nenhuma informação de debug ainda..."}
          </pre>
        </Paper>
      </Collapse>

      {/* Mostrar erro se houver */}
      {error && (
        <div className={classes.errorContainer}>
              <Button color="inherit" size="small" onClick={fetchSettings}>
                Tentar Novamente
              </Button>
            {error}
        </div>
      )}

      {/* Status de conectividade */}
      <div style={{ marginBottom: 16 }}>
        <strong>Status:</strong> {error ? "❌ Offline" : "✅ Conectado"} | 
        <strong> Usuário:</strong> {user?.name} | 
        <strong> Empresa:</strong> {user?.companyId}
      </div>

      {/* Configurações de Usuários */}
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className={classes.sectionTitle}>
            <PersonIcon />
            Aniversários de Usuários
          </Typography>
          <IconButton
            className={`${classes.expandButton} ${
              expandedSections.user ? classes.expandButtonOpen : ""
            }`}
            onClick={() => toggleSection("user")}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expandedSections.user}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.userBirthdayEnabled || false}
                    onChange={(e) => handleSettingChange("userBirthdayEnabled", e.target.checked)}
                    color="primary"
                  />
                }
                label="Habilitar notificações de aniversário de usuários"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mensagem de aniversário para usuários"
                value={settings?.userBirthdayMessage || ""}
                onChange={(e) => handleSettingChange("userBirthdayMessage", e.target.value)}
                disabled={!settings?.userBirthdayEnabled}
                helperText="Use {nome} para incluir o nome do usuário"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Configurações de Contatos */}
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className={classes.sectionTitle}>
            <PhoneIcon />
            Aniversários de Contatos
          </Typography>
          <IconButton
            className={`${classes.expandButton} ${
              expandedSections.contact ? classes.expandButtonOpen : ""
            }`}
            onClick={() => toggleSection("contact")}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expandedSections.contact}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.contactBirthdayEnabled || false}
                    onChange={(e) => handleSettingChange("contactBirthdayEnabled", e.target.checked)}
                    color="primary"
                  />
                }
                label="Habilitar envio automático de mensagens de aniversário para contatos"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mensagem de aniversário para contatos"
                value={settings?.contactBirthdayMessage || ""}
                onChange={(e) => handleSettingChange("contactBirthdayMessage", e.target.value)}
                disabled={!settings?.contactBirthdayEnabled}
                helperText="Use {nome} para incluir o nome do contato e {idade} para a idade"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Configurações Gerais */}
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className={classes.sectionTitle}>
            <ScheduleIcon />
            Configurações Gerais
          </Typography>
          <IconButton
            className={`${classes.expandButton} ${
              expandedSections.general ? classes.expandButtonOpen : ""
            }`}
            onClick={() => toggleSection("general")}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expandedSections.general}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                type="time"
                label="Horário de envio das mensagens"
                value={settings?.sendBirthdayTime || "09:00:00"}
                onChange={(e) => handleSettingChange("sendBirthdayTime", e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Horário em que as mensagens automáticas serão enviadas"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Botão Salvar */}
      <Box textAlign="center" mt={3}>
        <Button
          variant="contained"
          className={classes.saveButton}
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading}
          size="large"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </Box>
    </Box>
          </Paper>
    </MainContainer>
  );
};

export default BirthdaySettings;

