import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Badge,
  Chip,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTicketsStore } from '../stores/tickets';
import { useAuthStore } from '../stores/auth';
import { getSocket } from '../config/socket';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TicketsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { socket } = useAuthStore();
  const {
    tickets,
    loading,
    hasMore,
    searchTerm,
    status,
    fetchTickets,
    loadMoreTickets,
    setSearchTerm,
    setStatus,
    updateTicket,
    addTicket,
    removeTicket,
  } = useTicketsStore();

  const [searchValue, setSearchValue] = useState(searchTerm);

  useEffect(() => {
    fetchTickets({ reset: true });
  }, [fetchTickets]);

  // Socket listeners
  useEffect(() => {
    const currentSocket = getSocket();
    if (!currentSocket) return;

    const handleTicketUpdate = (data) => {
      updateTicket(data.ticket);
    };

    const handleTicketCreate = (data) => {
      addTicket(data.ticket);
    };

    const handleTicketDelete = (data) => {
      removeTicket(data.ticketId);
    };

    currentSocket.on('ticket', handleTicketUpdate);
    currentSocket.on('ticketCreate', handleTicketCreate);
    currentSocket.on('ticketDelete', handleTicketDelete);

    return () => {
      currentSocket.off('ticket', handleTicketUpdate);
      currentSocket.off('ticketCreate', handleTicketCreate);
      currentSocket.off('ticketDelete', handleTicketDelete);
    };
  }, [updateTicket, addTicket, removeTicket]);

  const handleTabChange = (event, newValue) => {
    const statusMap = ['open', 'pending', 'closed'];
    setStatus(statusMap[newValue]);
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchValue);
  };

  const handleSearchClear = () => {
    setSearchValue('');
    setSearchTerm('');
  };

  const handleRefresh = () => {
    fetchTickets({ reset: true });
  };

  const handleTicketClick = (ticket) => {
    navigate(`/tickets/${ticket.uuid}`);
  };

  const getStatusColor = (ticketStatus) => {
    switch (ticketStatus) {
      case 'open':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM HH:mm', { locale: ptBR });
  };

  const getTabValue = () => {
    switch (status) {
      case 'open':
        return 0;
      case 'pending':
        return 1;
      case 'closed':
        return 2;
      default:
        return 0;
    }
  };

  const handleScroll = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !loading) {
      loadMoreTickets();
    }
  }, [hasMore, loading, loadMoreTickets]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 0 }}>
        <TextField
          fullWidth
          placeholder={t('tickets.search')}
          value={searchValue}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton onClick={handleSearchClear} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSearchSubmit}
            disabled={loading}
          >
            {t('tickets.searchButton')}
          </Button>
          
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Status Tabs */}
      <Tabs
        value={getTabValue()}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('tickets.filters.open')} />
        <Tab label={t('tickets.filters.pending')} />
        <Tab label={t('tickets.filters.closed')} />
      </Tabs>

      {/* Tickets List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
        }}
        onScroll={handleScroll}
        className="custom-scrollbar"
      >
        {tickets.length === 0 && !loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50%',
              textAlign: 'center',
              p: 3,
            }}
          >
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {t('tickets.noTickets')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {tickets.map((ticket) => (
              <ListItem
                key={ticket.id}
                button
                onClick={() => handleTicketClick(ticket)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={ticket.unreadMessages || 0}
                    color="error"
                    overlap="circular"
                  >
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" noWrap>
                        {ticket.contact?.name || t('common.noData')}
                      </Typography>
                      <Chip
                        label={t(`tickets.status.${ticket.status}`)}
                        size="small"
                        color={getStatusColor(ticket.status)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {ticket.lastMessage || ''}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(ticket.updatedAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default TicketsPage;