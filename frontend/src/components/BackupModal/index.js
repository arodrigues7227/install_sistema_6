import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    borderRadius: 16,
    maxWidth: 600,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(2),
    top: theme.spacing(2),
    color: theme.palette.grey[500],
  },
  title: {
    padding: theme.spacing(3, 3, 2),
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  content: {
    padding: theme.spacing(2, 3, 3),
  },
  instructionList: {
    paddingLeft: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(1),
    },
  },
  codeBox: {
    margin: theme.spacing(2, 0),
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },
  codeContent: {
    backgroundColor: '#282c34',
    color: '#ffffff',
    fontFamily: 'monospace',
    padding: theme.spacing(2),
    margin: 0,
    overflowX: 'auto',
    whiteSpace: 'pre',
    fontSize: '0.875rem',
  },
  importantNote: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
  downloadButton: {
    marginTop: theme.spacing(3),
  },
}));

const BackupModal = ({ open, onClose, backupUrl }) => {
  const classes = useStyles();

  const handleDownload = () => {
    if (backupUrl) {
      const link = document.createElement('a');
      link.href = backupUrl.url;
      link.setAttribute('download', backupUrl.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{ className: classes.dialogPaper }}
    >
      <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
        <CloseIcon />
      </IconButton>
      <Typography variant="h5" className={classes.title}>
        Database Backup
      </Typography>
      <DialogContent className={classes.content}>
        <Typography variant="body1" paragraph>
          O arquivo de backup foi gerado como um arquivo ZIP contendo o SQL exportado do banco de dados PostgreSQL. Siga as instruções abaixo para utilizá-lo:
        </Typography>
        <ol className={classes.instructionList}>
          <li>Faça o download do arquivo zip usando o botão abaixo.</li>
          <li>Extraia o conteúdo do arquivo ZIP para obter o arquivo SQL.</li>
          <li>Para restaurar, abra um terminal ou prompt de comando.</li>
          <li>Certifique-se de que o PostgreSQL está instalado e configurado corretamente.</li>
          <li>Use o seguinte comando para restaurar o backup:</li>
        </ol>
        <div className={classes.codeBox}>
          <pre className={classes.codeContent}>
            pg_restore -U seu_usuario -d nome_do_banco -v caminho/para/arquivo_extraido.sql
          </pre>
        </div>
        <Typography variant="body2" component="div">
          <ol start="6" className={classes.instructionList}>
            <li>Substitua "seu_usuario", "nome_do_banco" e "caminho/para/arquivo_extraido.sql" com os valores apropriados.</li>
            <li>Digite a senha do PostgreSQL quando solicitado.</li>
            <li>Aguarde a conclusão do processo de restauração.</li>
          </ol>
        </Typography>
        <Box className={classes.importantNote}>
          <Typography variant="body2" component="p">
            <strong>Importante:</strong> O arquivo que você está baixando é um ZIP que contém o arquivo SQL do backup. Você precisará extraí-lo antes de usar o comando pg_restore.
          </Typography>
        </Box>
        <Button
          onClick={handleDownload}
          color="primary"
          variant="contained"
          disabled={!backupUrl}
          startIcon={<CloudDownloadIcon />}
          fullWidth
          className={classes.downloadButton}
        >
          Download Backup ZIP
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BackupModal;