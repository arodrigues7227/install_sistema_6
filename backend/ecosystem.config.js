module.exports = [{
  script: 'dist/server.js',
  name: 'multipremium-back',
  exec_mode: 'fork',
  cron_restart: '05 00 * * *',
  max_memory_restart: '4GB', // Configuração para reiniciar quando atingir 769 MB de memória
  node_args: '--max-old-space-size=8GB', // Limite de memória do Node.js para 769 MB
  watch: false
}]