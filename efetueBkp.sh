#!/bin/bash

# Defina as informações do banco de dados
DB_USER="root"
DB_PASS="SENHA_DO_BD"
DB_NAME="saas2"

# Defina o diretório de destino para o backup
BACKUP_DIR="/www/backupsCtrl"
BACKEND_DIR="/www/wwwroot/saas/backend"
FRONTEND_DIR="/www/wwwroot/saas/frontend"

# Criar o diretório base, se não existir
mkdir -p "$BACKUP_DIR"
 
# Gere um nome de arquivo com timestamp para o backup do banco de dados
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql"
 
# Comando pg_dump para realizar o backup
pg_dump -U "$DB_USER" -d "$DB_NAME" -w -F c -b -v -f "$DB_BACKUP_FILE"
 
# Compactar o arquivo de backup do banco de dados
gzip -9 "$DB_BACKUP_FILE"
  
# Verifique se o backup do banco de dados foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "Backup do banco de dados PostgreSQL concluído com sucesso."
else
    echo "Erro ao fazer backup do banco de dados PostgreSQL."
fi

# Gere um nome de arquivo com timestamp para o backup do banco de dados
DB_BACKUP_FILE_CIM="$BACKUP_DIR/db_CIM_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql"
 
# Comando pg_dump para realizar o backup
pg_dump -U "$DB_USER" -d "cimzap" -w -F c -b -v -f "$DB_BACKUP_FILE_CIM"
 
# Compactar o arquivo de backup do banco de dados
gzip -9 "$DB_BACKUP_FILE_CIM"
 
# Verifique se o backup do banco de dados foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "Backup do banco de dados PostgreSQL concluído com sucesso."
else
    echo "Erro ao fazer backup do banco de dados PostgreSQL."
fi

# Gere um nome de arquivo com timestamp para o backup
BACKUP_ONYX="$BACKUP_DIR/backup_onyx.tar.gz"
BACKUP_CRM="$BACKUP_DIR/backup_crm.tar.gz"
BACKUP_WAT="$BACKUP_DIR/backup_wat.tar.gz"
BACKUP_PKS="$BACKUP_DIR/backup_erp.tar.gz"
BACKUP_SVR="$BACKUP_DIR/backup_svr.tar.gz"

# Use o tar para compactar o conteúdo do diretório de origem
tar -czf "$BACKUP_ONYX" -C "/www/wwwroot/onyxsistemas.com" .
tar -czf "$BACKUP_CRM" -C "/www/wwwroot/um7.com.br" .
tar -czf "$BACKUP_WAT" -C "/www/wwwroot/watende.com.br" .
tar -czf "$BACKUP_PKS" -C "/www/wwwroot/erp.temai.app.br" .
tar --exclude="node_modules" -czf "$BACKUP_SVR" -C "/www/wwwroot/servers_backend" . 

tar --exclude="node_modules" --exclude="dist" --exclude="public" -czf "$BACKUP_DIR/backend.tar.gz" -C $BACKEND_DIR . 
tar --exclude="node_modules" --exclude="build" -czf "$BACKUP_DIR/frontend.tar.gz" -C $FRONTEND_DIR . 

# Deletar arquivos de backup do banco de dados com mais de 10 dias
find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +10 -exec rm {} +

# Deletar arquivos de backup do banco de dados com mais de 10 dias
find "$BACKUP_DIR" -type f -name "db_CIM_backup_*.sql.gz" -mtime +10 -exec rm {} +

# Deletar arquivos de backups com mais de 10 dias
find "$BACKUP_DIR" -type f -name "backup_*.tar.gz" -mtime +10 -exec rm {} +
