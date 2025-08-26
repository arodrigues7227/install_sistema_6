import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTicketsStore } from '../stores/tickets';
import { useAuthStore } from '../stores/auth';
import { getSocket } from '../config/socket';
import api from '../config/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TicketDetailPage = () => {
  const { t } = useTranslation();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTicket, setCurrentTicket } = useTicketsStore();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch ticket and messages
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        
        // Fetch ticket details
        const ticketResponse = await api.get(`/tickets/${ticketId}`);
        setCurrentTicket(ticketResponse.data);
        
        // Fetch messages
        const messagesResponse = await api.get(`/messages/${ticketId}`);
        setMessages(messagesResponse.data.messages || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId, setCurrentTicket]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const currentSocket = getSocket();
    if (!currentSocket || !ticketId) return;

    const handleAppMessage = (data) => {
      if (data.message.ticketId.toString() === ticketId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleMessageUpdate = (data) => {
      if (data.message.ticketId.toString() === ticketId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.message.id ? data.message : msg
          )
        );
      }
    };

    currentSocket.on('appMessage', handleAppMessage);
    currentSocket.on('messageUpdate', handleMessageUpdate);

    return () => {
      currentSocket.off('appMessage', handleAppMessage);
      currentSocket.off('messageUpdate', handleMessageUpdate);
    };
  }, [ticketId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post(`/messages/${ticketId}`, {
        body: newMessage.trim(),
      });

      // Message will be added via socket, so we just clear the input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const isMyMessage = (message) => {
    return message.userId === user?.id;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentTicket) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>{t('errors.notFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Custom Header for this page */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/tickets')}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
            {currentTicket.contact?.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {currentTicket.contact?.name || t('common.noData')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={t(`tickets.status.${currentTicket.status}`)}
                size="small"
                color="default"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          bgcolor: 'grey.50',
        }}
        className="custom-scrollbar"
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMyMessage(message) ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: '80%',
                bgcolor: isMyMessage(message) ? 'primary.main' : 'white',
                color: isMyMessage(message) ? 'white' : 'text.primary',
                borderRadius: 2,
                borderBottomLeftRadius: !isMyMessage(message) ? 0.5 : 2,
                borderBottomRightRadius: isMyMessage(message) ? 0.5 : 2,
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.body}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                  textAlign: 'right',
                }}
              >
                {formatMessageTime(message.createdAt)}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper elevation={3} sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={t('tickets.chat.typingMessage')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            disabled={sending}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton size="small" disabled>
                    <AttachFileIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Fab
            color="primary"
            size="small"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </Fab>
        </Box>
      </Paper>
    </Box>
  );
};

export default TicketDetailPage;