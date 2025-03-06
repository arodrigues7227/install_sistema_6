#!/bin/bash

# Inicialização de variáveis
UPDATE_BACKEND=false
UPDATE_FRONTEND=false
UPDATE_NODE_MODULES=false
RUN_MIGRATIONS=false
FORCE_MODE=false
BACKUP_MODE=false
KEEP_SRC=false
BRANCH="main"

# Função para mostrar ajuda
show_help() {
    echo "Uso: ./atualizar.sh [opções]"
    echo "Opções:"
    echo "  -bd              Atualiza o backend"
    echo "  -fd              Atualiza o frontend"
    echo "  -nm              Atualiza node_modules (pode ser usado com -bd e/ou -fd)"
    echo "  -sm              Executa migrações do Sequelize (apenas com -bd)"
    echo "  -f               Modo forçado (apenas build, sem npm install ou migrações)"
    echo "  -bkp             Realiza backup das pastas dist/build antes de atualizar"
    echo "  -k               Mantém as pastas src do frontend e backend"
    echo "  -h               Mostra esta mensagem de ajuda"
    echo ""
    echo "Se nenhuma opção for informada, será realizada uma atualização completa do sistema"
    exit 0
}

# Verificar se não foram passados parâmetros
if [ $# -eq 0 ]; then
    UPDATE_BACKEND=true
    UPDATE_FRONTEND=true
    UPDATE_NODE_MODULES=true
    RUN_MIGRATIONS=true
fi

# Parsing de parâmetros
while [[ $# -gt 0 ]]; do
    case $1 in
        -bd)
            UPDATE_BACKEND=true
            shift
            ;;
        -fd)
            UPDATE_FRONTEND=true
            shift
            ;;
        -nm)
            UPDATE_NODE_MODULES=true
            shift
            ;;
        -sm)
            RUN_MIGRATIONS=true
            shift
            ;;
        -f)
            FORCE_MODE=true
            UPDATE_BACKEND=true
            UPDATE_FRONTEND=true
            shift
            ;;
        -bkp)
            BACKUP_MODE=true
            shift
            ;;
        -k)
            KEEP_SRC=true
            shift
            ;;
        -h)
            show_help
            ;;
        *)
            echo "❌ Opção inválida: $1"
            show_help
            ;;
    esac
done

echo "🚀 Atualizando o sistema, por favor aguarde."

# Verificar consistência dos parâmetros
if $RUN_MIGRATIONS && ! $UPDATE_BACKEND; then
    echo "❌ Erro: -sm só funciona com -bd."
    exit 1
fi

# Configuração inicial
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
NAME=${DIR##*/}
echo "📂 Nome da pasta: $NAME"

# Verificar instância no PM2
HAS_BACKEND=$(pm2 list | grep "$NAME-backend")
if [ -z "$HAS_BACKEND" ]; then
    echo "💡 Nenhuma instância backend encontrada no PM2. Usando nome padrão: $NAME."
else
    if [[ $NAME != *"-backend"* ]]; then
        NAME="$NAME-backend"
        echo "💡 Instância backend detectada. Ajustando nome para: $NAME."
    fi
fi

# Configuração da branch
if [ "$FORCE_MODE" = true ]; then
    read -p "🌿 Qual branch deseja utilizar? (padrão: main): " BRANCH_INPUT
    BRANCH=${BRANCH_INPUT:-main}
    echo "✅ Branch selecionada: $BRANCH"
else
    read -p "🌿 Qual branch deseja utilizar? (padrão: main): " BRANCH_INPUT
    BRANCH=${BRANCH_INPUT:-main}
    echo "✅ Branch selecionada: $BRANCH"

    # Verifica se a branch informada é diferente da branch atual
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" != "$CURRENT_BRANCH" ]; then
        echo "🔄 Mudando para a branch $BRANCH..."
        git checkout $BRANCH
        if [ $? -ne 0 ]; then
            echo "❌ Erro ao mudar para a branch $BRANCH. Verifique se a branch existe."
            exit 1
        fi
    fi
fi

# Backup do manifest.json
echo "📂 Salvando manifest.json customizado..."
CUSTOM_MANIFEST_PATH="frontend/public/manifest.json"
TEMP_MANIFEST_PATH="/tmp/manifest.json"
if [ -f "$CUSTOM_MANIFEST_PATH" ]; then
    cp "$CUSTOM_MANIFEST_PATH" "$TEMP_MANIFEST_PATH"
    echo "✅ Arquivo manifest.json salvo temporariamente."
else
    echo "⚠️ Nenhum manifest.json customizado encontrado para salvar."
fi

# Atualização do repositório
echo "⏳ Resetando a branch local para a branch remota '$BRANCH'..."
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH
echo "✅ Branch '$BRANCH' atualizada com sucesso."

# Restaurar manifest.json
echo "📂 Restaurando manifest.json customizado..."
if [ -f "$TEMP_MANIFEST_PATH" ]; then
    cp "$TEMP_MANIFEST_PATH" "$CUSTOM_MANIFEST_PATH"
    echo "✅ Arquivo manifest.json customizado restaurado."
else
    echo "⚠️ Nenhum arquivo manifest.json encontrado para restaurar."
fi

# Função para realizar backup
perform_backup() {
    if $BACKUP_MODE; then
        TIMESTAMP=$(date +"%Y%m%d%H%M%S")
        BACKUP_DIR="backup_$TIMESTAMP"
        mkdir -p $BACKUP_DIR

        if $UPDATE_BACKEND; then
            echo "📦 Realizando backup da pasta backend/dist..."
            tar -czf "$BACKUP_DIR/backend_dist_$TIMESTAMP.tar.gz" -C backend dist
            echo "✅ Backup do backend/dist concluído."
        fi

        if $UPDATE_FRONTEND; then
            echo "📦 Realizando backup da pasta frontend/build..."
            tar -czf "$BACKUP_DIR/frontend_build_$TIMESTAMP.tar.gz" -C frontend build
            echo "✅ Backup do frontend/build concluído."
        fi
    fi
}

# Realizar backup antes de atualizar
perform_backup

# Parar PM2
if $UPDATE_BACKEND; then
    echo "🛑 Parando instância PM2: $NAME..."
    pm2 stop $NAME
fi

# Atualização do Backend
if $UPDATE_BACKEND; then
    cd backend || exit
    echo "📂 Acessando a pasta 'backend'."

    if ! $FORCE_MODE && $UPDATE_NODE_MODULES; then
        echo "🧹 Removendo node_modules do backend..."
        rm -rf node_modules
        echo "📦 Instalando dependências do backend..."
        npm install
    else
        echo "⏭️ Modo forçado: pulando atualização de dependências do backend..."
    fi

    echo "🏗️ Construindo aplicação..."
    npm run build
    echo "✅ Build concluído."

    echo "📄 Copiando arquivo .env para a pasta dist..."
    cp .env dist/

    if ! $FORCE_MODE && $RUN_MIGRATIONS; then
        echo "📂 Executando migrações do Sequelize..."
        npx sequelize db:migrate
        echo "✅ Migrações aplicadas com sucesso."
    else
        echo "⏭️ Modo forçado: pulando migrações do Sequelize..."
    fi

    echo "🚀 Reiniciando aplicação no PM2 com ambiente de produção..."
    NODE_ENV=production pm2 start $NAME --update-env --node-args="--max-old-space-size=8192"
    echo "✅ Aplicação reiniciada."

    if ! $KEEP_SRC; then
        echo "🧹 Removendo arquivos 'src' para liberar espaço..."
        rm -rf src
    else
        echo "🔒 Mantendo pasta 'src' do backend conforme solicitado..."
    fi

    cd ..
fi

# Atualização do Frontend
if $UPDATE_FRONTEND; then
    cd frontend || exit
    echo "📂 Acessando a pasta 'frontend'."

    if ! $FORCE_MODE && $UPDATE_NODE_MODULES; then
        echo "🧹 Removendo node_modules do frontend..."
        rm -rf node_modules
        echo "📦 Instalando dependências do frontend..."
        npm install --legacy-peer-deps
    else
        echo "⏭️ Modo forçado: pulando atualização de dependências do frontend..."
    fi

    echo "🏗️ Construindo aplicação frontend..."
    npm run build
    echo "✅ Build do frontend concluído."

    if ! $KEEP_SRC; then
        echo "🧹 Removendo arquivos 'src' do frontend..."
        rm -rf src
    else
        echo "🔒 Mantendo pasta 'src' do frontend conforme solicitado..."
    fi

    cd ..
fi

# Limpeza final
echo "🔄 Limpando logs antigos no PM2..."
pm2 flush
echo "✅ Logs limpos com sucesso."

echo "🎉 Atualização concluída com sucesso! Aproveite seu sistema! 🚀"