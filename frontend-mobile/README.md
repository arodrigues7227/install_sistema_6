# Frontend Mobile - Sistema de Atendimento

Frontend mobile otimizado para dispositivos móveis, focado exclusivamente em login de usuário e realização de atendimentos (tickets).

## 🚀 Características

- **100% Mobile-First**: Interface otimizada especificamente para dispositivos móveis
- **Funcionalidades Essenciais**: Apenas login e atendimentos (tickets)
- **Performance Otimizada**: Bundle mínimo e carregamento rápido
- **PWA Ready**: Suporte a Progressive Web App
- **Real-time**: Comunicação em tempo real via WebSocket
- **Tema Claro/Escuro**: Suporte a múltiplos temas

## 📱 Funcionalidades

### ✅ Implementadas

1. **Autenticação**
   - Login com email/senha
   - Logout
   - Verificação automática de sessão
   - Interceptação de requisições para renovação de token

2. **Lista de Tickets**
   - Visualização de tickets com filtros (aberto, pendente, fechado)
   - Busca por texto
   - Carregamento paginado (scroll infinito)
   - Atualização em tempo real via WebSocket
   - Indicadores visuais de mensagens não lidas

3. **Chat de Atendimento**
   - Interface de chat em tempo real
   - Envio de mensagens
   - Histórico de mensagens
   - Indicadores de status das mensagens
   - Auto-scroll para novas mensagens

4. **Perfil do Usuário**
   - Visualização de dados do usuário
   - Edição de perfil (nome, email)
   - Informações da conta

5. **Configurações**
   - Alteração de tema (claro/escuro/sistema)
   - Configurações de notificação
   - Informações sobre o app
   - Logout

## 🏗️ Arquitetura

### Estrutura de Pastas

```
frontend-mobile/
├── public/                 # Arquivos públicos
│   ├── index.html         # Template HTML otimizado para mobile
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Layout/        # Layout principal com navegação
│   │   └── LoadingScreen.js
│   ├── config/           # Configurações
│   │   ├── api.js        # Configuração do Axios
│   │   └── socket.js     # Configuração do Socket.io
│   ├── i18n/             # Internacionalização
│   │   ├── index.js      # Configuração do i18next
│   │   └── locales/pt.json # Traduções em português
│   ├── pages/            # Páginas da aplicação
│   │   ├── LoginPage.js
│   │   ├── TicketsPage.js
│   │   ├── TicketDetailPage.js
│   │   ├── ProfilePage.js
│   │   └── SettingsPage.js
│   ├── routes/           # Roteamento
│   │   ├── Router.js
│   │   └── ProtectedRoute.js
│   ├── stores/           # Estado global (Zustand)
│   │   ├── auth.js       # Store de autenticação
│   │   └── tickets.js    # Store de tickets
│   ├── styles/           # Estilos globais
│   │   └── global.css    # CSS otimizado para mobile
│   ├── theme/            # Tema Material-UI
│   │   └── index.js      # Configuração de temas
│   ├── App.js            # Componente principal
│   └── index.js          # Ponto de entrada
├── package.json          # Dependências otimizadas
└── .env.example          # Variáveis de ambiente
```

### Tecnologias Utilizadas

- **React 18**: Biblioteca principal
- **Material-UI v5**: Componentes de interface
- **Zustand**: Gerenciamento de estado global
- **React Router v6**: Roteamento
- **Axios**: Cliente HTTP
- **Socket.io**: Comunicação em tempo real
- **React-i18next**: Internacionalização
- **Formik + Yup**: Formulários e validação
- **date-fns**: Manipulação de datas

### Otimizações Mobile

1. **Performance**:
   - Bundle splitting automático
   - Lazy loading de componentes
   - Debounce em buscas
   - Scroll infinito otimizado
   - Minimização de re-renders

2. **UX Mobile**:
   - Altura mínima de 44px para botões (touch targets)
   - Font-size mínimo de 16px para prevenir zoom no iOS
   - Navegação via bottom tabs
   - Swipe gestures (futuro)
   - PWA com manifest

3. **Design Responsivo**:
   - Mobile-first approach
   - Flexbox e Grid layout
   - Typography otimizada para mobile
   - Componentes adaptáveis
   - Safe areas para devices com notch

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 16+
- npm ou yarn

### Configuração

1. **Clone e acesse o diretório**:
```bash
cd frontend-mobile
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8080
GENERATE_SOURCEMAP=false
```

4. **Execute em desenvolvimento**:
```bash
npm start
```

5. **Build para produção**:
```bash
npm run build
```

## 🔌 Integração com Backend

### APIs Utilizadas

1. **Autenticação**:
   - `POST /auth/login` - Login do usuário
   - `GET /auth/refresh-token` - Renovação de token

2. **Tickets**:
   - `GET /tickets` - Lista de tickets com filtros
   - `GET /tickets/:id` - Detalhes do ticket

3. **Mensagens**:
   - `GET /messages/:ticketId` - Mensagens do ticket
   - `POST /messages/:ticketId` - Enviar mensagem

4. **Usuário**:
   - `PUT /users/profile` - Atualizar perfil

### WebSocket Events

- `ticket` - Atualização de ticket
- `ticketCreate` - Novo ticket criado
- `ticketDelete` - Ticket removido
- `appMessage` - Nova mensagem
- `messageUpdate` - Mensagem atualizada

## 🌐 Internacionalização

O sistema utiliza react-i18next com suporte inicial ao português. As traduções estão organizadas por contexto:

- `login.*` - Tela de login
- `tickets.*` - Lista e detalhes de tickets
- `profile.*` - Perfil do usuário
- `settings.*` - Configurações
- `common.*` - Elementos comuns
- `errors.*` - Mensagens de erro

### Exemplo de uso:
```javascript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <div>{t('login.title')}</div>;
};
```

## 📊 Estado da Aplicação

### Auth Store (Zustand)
```javascript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  loading: boolean,
  socket: Socket | null,
  login: (credentials) => Promise,
  logout: () => void,
  checkAuth: () => Promise
}
```

### Tickets Store (Zustand)
```javascript
{
  tickets: Ticket[],
  currentTicket: Ticket | null,
  loading: boolean,
  hasMore: boolean,
  searchTerm: string,
  status: 'open' | 'pending' | 'closed',
  fetchTickets: (params) => Promise,
  setCurrentTicket: (ticket) => void,
  updateTicket: (ticket) => void,
  // ... outros métodos
}
```

## 🎨 Personalização de Tema

O sistema suporta temas claro e escuro com configurações otimizadas para mobile:

```javascript
// Tema claro/escuro definido em src/theme/index.js
const lightTheme = createTheme({
  // Configurações otimizadas para mobile
  typography: {
    button: {
      fontSize: '1rem', // Previne zoom no iOS
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Touch target mínimo
        }
      }
    }
  }
});
```

## 🚀 Deploy e PWA

### Build de Produção
```bash
npm run build
```

### PWA Features
- Service Worker configurado
- Manifest.json otimizado
- Ícones para diferentes tamanhos
- Suporte offline básico

## 🔧 Próximos Passos

### Melhorias Planejadas
1. **Funcionalidades**:
   - Anexos de arquivos
   - Notas internas
   - Transferência de tickets
   - Notificações push

2. **Performance**:
   - Service Worker avançado
   - Cache de dados offline
   - Compressão de imagens
   - Virtual scrolling

3. **UX**:
   - Gestos de swipe
   - Animations e transições
   - Feedback tátil
   - Dark mode automático

### Expansão
- Suporte a outros idiomas
- Temas customizáveis
- Plugins de integração
- Dashboard mobile

## 📝 Convenções de Código

- **Componentes**: PascalCase (ex: `TicketListItem`)
- **Arquivos**: PascalCase para componentes, camelCase para utilitários
- **Props**: camelCase
- **Hooks customizados**: prefixo `use` (ex: `useTickets`)
- **Stores**: camelCase com sufixo `Store` (ex: `authStore`)

## 🤝 Contribuição

1. Sempre criar chaves de tradução para novos textos
2. Seguir padrões de acessibilidade (WCAG)
3. Manter componentes pequenos e reutilizáveis
4. Testar em diferentes dispositivos móveis
5. Otimizar para performance

## 📱 Compatibilidade

- **iOS**: Safari 14+, Chrome 90+
- **Android**: Chrome 90+, Samsung Internet 14+
- **Resolução mínima**: 320px de largura
- **Touch**: Suporte completo a gestos touch