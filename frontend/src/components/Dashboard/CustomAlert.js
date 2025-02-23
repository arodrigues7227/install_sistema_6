import React from 'react';
import { Paper, Typography, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const CustomAlert = ({ severity, onClose, children }) => {
  // Define a cor de fundo com base na severidade (info, success, warning, error)
  const getBackgroundColor = () => {
    switch (severity) {
      case 'info':
        return '#2196f3'; // Azul
      case 'success':
        return '#4caf50'; // Verde
      case 'warning':
        return '#ff9800'; // Laranja
      case 'error':
        return '#f44336'; // Vermelho
      default:
        return '#2196f3'; // Azul padrão
    }
  };

  return (
    <Paper
      elevation={6}
      style={{
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '16px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}
    >
      <Typography>{children}</Typography>
      <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default CustomAlert;