// serviceWorker.js - Registro otimizado para iOS
export function register() {
  console.log("Iniciando registro do service worker para iOS", navigator);
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
        console.log('Registrando SW em:', swUrl);
        
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
          updateViaCache: 'none' // Importante para iOS - evita cache de SW
        });
        
        console.log('Service worker registrado com sucesso!', registration);
        
        // Aguarda o SW estar pronto
        await navigator.serviceWorker.ready;
        console.log('Service worker está pronto');
        
        // Força atualização se houver nova versão
        if (registration.waiting) {
          console.log('Nova versão do SW detectada, aplicando...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Listener para atualizações do SW
        registration.addEventListener('updatefound', () => {
          console.log('Nova versão do service worker encontrada');
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão do SW instalada');
            }
          });
        });
        
        // Keep-alive para iOS - mantém SW ativo
        const keepAlive = () => {
          if (registration.active) {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
              console.log('Keep-alive response:', event.data);
            };
            registration.active.postMessage(
              { type: 'KEEP_ALIVE' }, 
              [channel.port2]
            );
          }
        };
        
        // Executa keep-alive a cada 30 segundos
        setInterval(keepAlive, 30000);
        
        // Keep-alive imediato
        setTimeout(keepAlive, 1000);
        
        return registration;
        
      } catch (error) {
        console.error('Erro durante o registro do service worker:', error);
        throw error;
      }
    });
    
    // Remove o listener de push do window - deve estar apenas no SW
    // Comentando esta parte que estava causando problemas
    /*
    window.addEventListener('push', (event) => {
      const data = event.data ? event.data.json() : {};
      console.log('Push recebido:', data);
      if (data.title) {
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || `${process.env.PUBLIC_URL}/favicon.ico`
        });
      }
    });
    */
  } else {
    console.warn('Service Worker não é suportado neste navegador');
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        console.log('Desregistrando service worker');
        return registration.unregister();
      })
      .then(() => {
        console.log('Service worker desregistrado com sucesso');
      })
      .catch((error) => {
        console.error('Erro durante o desregistro do service worker:', error);
      });
  }
}

// Função para solicitar permissão de notificação
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações');
    return 'not-supported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  console.log('Permissão de notificação:', permission);
  return permission;
}

// Função para verificar se é iOS
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Função para verificar se é PWA
export function isPWA() {
  return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
}