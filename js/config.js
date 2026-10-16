/* ============================================================
   LES — Configuração global do front
   ============================================================
   Este arquivo é carregado ANTES de qualquer outro módulo.
   Ele expõe window.LES_CONFIG, usado por js/core/*.js.

   Ajuste API_URL conforme o ambiente:
     - dev  → http://localhost:8080/api
     - prod → https://api.lesifpe.com.br/api
   ============================================================ */
(function () {
    'use strict';

    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    window.LES_CONFIG = {
        APP_NAME: 'LES-IFPE',
        APP_VERSION: '0.1.0',

        /* ── Backend ── */
        API_URL: isLocal
            ? 'http://localhost:8080/api'
            : 'https://api.lesifpe.com.br/api',

        /* ── Chaves de storage ── */
        ACCESS_KEY:  'les.access',
        REFRESH_KEY: 'les.refresh',
        USER_KEY:    'les.user',

        /* ── Comportamentos ── */
        TOAST_TIMEOUT: 4000,
        SESSION_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 min

        /* ── Rotas públicas que NÃO exigem login ── */
        PUBLIC_ROUTES: [
            '/login.html',
            '/index.html',
            '/'
        ],

        /* ── Rota padrão após login ── */
        DEFAULT_ROUTE: '/app/dashboard.html'
    };
})();
