
console.log('Service Worker carregado');

self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativando...');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('Service Worker ativado e controlando todas as páginas');
    })
  );
});

// Handler principal para notificações push - CRÍTICO para iOS
self.addEventListener('push', (event) => {
  console.log('Push recebido no service worker:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('Dados da notificação:', data);
    } catch (e) {
      console.error('Erro ao parsear dados da notificação:', e);
      data = { 
        title: 'Nova mensagem', 
        body: event.data.text() || 'Você tem uma nova mensagem'
      };
    }
  } else {
    data = { 
      title: 'Nova notificação', 
      body: 'Você tem uma nova mensagem'
    };
  }

  const options = {
    body: data.body || 'Você tem uma nova mensagem',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    tag: data.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // IMPORTANTE para iOS - mantém notificação visível
    silent: false, // CRÍTICO para áudio no iOS
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      clickAction: data.url || '/'
    },
    // Configurações específicas para melhor compatibilidade iOS
    showTrigger: true,
    sticky: true,
    dir: 'ltr',
    lang: 'pt-BR'
  };

  console.log('Exibindo notificação com opções:', options);

  const notificationPromise = self.registration.showNotification(
    data.title || 'Nova Notificação',
    options
  );

  event.waitUntil(notificationPromise);
});

// Handler para clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || event.notification.data?.clickAction || '/';
  
  console.log('Abrindo URL:', urlToOpen);
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log('Clientes encontrados:', clientList.length);
      
      // Verifica se já existe uma aba aberta com a URL
      for (const client of clientList) {
        if (client.url && client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          console.log('Focando cliente existente');
          return client.focus();
        }
      }
      
      // Se não encontrou, verifica se existe alguma aba do site aberta
      for (const client of clientList) {
        if (client.url && 'navigate' in client) {
          console.log('Navegando cliente existente para nova URL');
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Abre nova aba se necessário
      if (self.clients.openWindow) {
        console.log('Abrindo nova janela');
        return self.clients.openWindow(urlToOpen);
      }
    }).catch(error => {
      console.error('Erro ao processar clique na notificação:', error);
    })
  );
});

// Handler para fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
});

// Keep-alive para iOS - tenta manter o SW ativo
self.addEventListener('message', (event) => {
  console.log('Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    // Responde para manter conexão ativa
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        status: 'alive', 
        timestamp: Date.now() 
      });
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Intercepta requests para manter SW ativo (estratégia adicional para iOS)
self.addEventListener('fetch', (event) => {
  // Não intercepta realmente, apenas mantém o SW ativo
  return;
});

console.log('Service Worker configurado completamente');