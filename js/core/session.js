/* ============================================================
   LES — Sessão em segundo plano
   ============================================================
   - Atualiza dados do usuário a cada N minutos
   - Mantém o JWT "quente"
   - Sincroniza logout entre abas
   ============================================================ */

import Auth from './auth.js';

let timer = null;

function tick() {
    if (!Auth.isAuthenticated()) return;
    Auth.refreshMe().catch(() => {
        /* Se falhar, o api.js já redireciona para login */
    });
}

export function startSessionWatcher() {
    stopSessionWatcher();
    tick(); // primeira chamada
    timer = setInterval(tick, window.LES_CONFIG.SESSION_REFRESH_INTERVAL);
}

export function stopSessionWatcher() {
    if (timer) { clearInterval(timer); timer = null; }
}

/* ── Sincronizar logout entre abas ── */
window.addEventListener('storage', (e) => {
    if (e.key === window.LES_CONFIG.ACCESS_KEY && e.newValue === null) {
        /* Outra aba fez logout */
        window.location.href = '/login.html';
    }
});
