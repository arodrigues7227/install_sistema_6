import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth';
import { useTicketsStore } from '../../stores/tickets';

const Layout = ({ children, themeMode, setTheme }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { tickets } = useTicketsStore();
  const [anchorEl, setAnchorEl] = useState(null);

  const isTicketDetail = location.pathname.includes('/tickets/');
  const hideBottomNav = isTicketDetail;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const getPageTitle = () => {
    if (location.pathname === '/tickets') return t('tickets.title');
    if (isTicketDetail) return t('tickets.details.title') || t('tickets.chat.title');
    if (location.pathname === '/profile') return t('profile.title');
    if (location.pathname === '/settings') return t('settings.title');
    return t('tickets.title');
  };

  const getCurrentTab = () => {
    if (location.pathname.includes('/tickets')) return 0;
    if (location.pathname === '/profile') return 1;
    if (location.pathname === '/settings') return 2;
    return 0;
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/tickets');
        break;
      case 1:
        navigate('/profile');
        break;
      case 2:
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  const unreadCount = tickets.filter(ticket => 
    ticket.unreadMessages > 0
  ).length;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
          
          {user && (
            <>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                edge="end"
              >
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  {t('navigation.profile')}
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  {t('navigation.settings')}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  {t('navigation.logout')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pb: hideBottomNav ? 0 : 7, // Space for bottom navigation
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <BottomNavigation
          value={getCurrentTab()}
          onChange={handleTabChange}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 1000,
          }}
        >
          <BottomNavigationAction
            label={t('navigation.tickets')}
            icon={
              unreadCount > 0 ? (
                <Badge badgeContent={unreadCount} color="error">
                  <ChatIcon />
                </Badge>
              ) : (
                <ChatIcon />
              )
            }
          />
          <BottomNavigationAction
            label={t('navigation.profile')}
            icon={<PersonIcon />}
          />
          <BottomNavigationAction
            label={t('navigation.settings')}
            icon={<SettingsIcon />}
          />
        </BottomNavigation>
      )}
    </Box>
  );
};

export default Layout;