import React from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Brightness6 as SystemModeIcon,
  Notifications as NotificationsIcon,
  VolumeUp as SoundIcon,
  Vibration as VibrationIcon,
  Info as InfoIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';

const SettingsPage = ({ themeMode, setTheme }) => {
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };

  const handleLogout = () => {
    if (window.confirm(t('settings.logout'))) {
      logout();
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Theme Settings */}
      <Paper elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              {themeMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
            </ListItemIcon>
            <ListItemText primary={t('settings.theme')} />
          </ListItem>
          <ListItem sx={{ pl: 4 }}>
            <RadioGroup
              value={themeMode}
              onChange={handleThemeChange}
              sx={{ width: '100%' }}
            >
              <FormControlLabel
                value="light"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LightModeIcon fontSize="small" />
                    {t('settings.themeLight')}
                  </Box>
                }
              />
              <FormControlLabel
                value="dark"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DarkModeIcon fontSize="small" />
                    {t('settings.themeDark')}
                  </Box>
                }
              />
              <FormControlLabel
                value="system"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SystemModeIcon fontSize="small" />
                    {t('settings.themeSystem')}
                  </Box>
                }
              />
            </RadioGroup>
          </ListItem>
        </List>
      </Paper>

      {/* Notification Settings */}
      <Paper elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText primary={t('settings.notifications')} />
            <Switch defaultChecked />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SoundIcon />
            </ListItemIcon>
            <ListItemText primary={t('settings.sound')} />
            <Switch defaultChecked />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <VibrationIcon />
            </ListItemIcon>
            <ListItemText primary={t('settings.vibration')} />
            <Switch defaultChecked />
          </ListItem>
        </List>
      </Paper>

      {/* About Section */}
      <Paper elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText 
              primary={t('settings.about')}
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {t('settings.version')}: 1.0.0
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sistema de Atendimento Mobile
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        </List>
      </Paper>

      {/* Logout Section */}
      <Paper elevation={2} sx={{ borderRadius: 3 }}>
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary={t('settings.logout')}
              primaryTypographyProps={{ color: 'error' }}
            />
          </ListItem>
        </List>
      </Paper>

      {/* User Info */}
      <Paper elevation={2} sx={{ mt: 2, p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('common.info')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="textSecondary">
          <strong>Usuário:</strong> {user?.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          <strong>Email:</strong> {user?.email}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          <strong>Perfil:</strong> {user?.profile}
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;