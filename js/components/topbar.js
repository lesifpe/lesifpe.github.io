/* ============================================================
   LES — Topbar do painel
   ============================================================ */

import Auth from '../core/auth.js';

function initials(name) {
    if (!name) return '?';
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();
}

export function renderTopbar(container, { title = '' } = {}) {
    if (!container) return;

    const user = Auth.user || {};
    const avatar = user.fotoUrl
        ? `<img src="${user.fotoUrl}" alt="${user.nome}">`
        : initials(user.nome);

    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem">
            <button class="app-sidebar-toggle" data-sidebar-toggle aria-label="Abrir menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
            <span class="app-topbar-title">${title}</span>
        </div>

        <div class="app-topbar-actions">
            <div class="app-user-chip" id="user-chip" role="button" tabindex="0">
                <div class="avatar avatar-sm">${avatar}</div>
                <span class="app-user-name">${user.nome || 'Usuário'}</span>
            </div>
        </div>
    `;

    /* Menu dropdown simples */
    const chip = container.querySelector('#user-chip');
    chip?.addEventListener('click', () => openUserMenu(chip));
    chip?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openUserMenu(chip);
        }
    });
}

function openUserMenu(anchor) {
    document.querySelector('.user-menu-dropdown')?.remove();

    const menu = document.createElement('div');
    menu.className = 'user-menu-dropdown';
    menu.style.cssText = `
        position: absolute;
        top: 58px;
        right: 20px;
        background: #111;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.5rem;
        min-width: 200px;
        z-index: 200;
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    `;
    menu.innerHTML = `
        <a href="/app/perfil.html"
           style="display:block;padding:0.6rem 0.8rem;border-radius:6px;
                  color:var(--white);text-decoration:none;font-size:0.88rem"
           onmouseover="this.style.background='rgba(53,255,118,0.08)'"
           onmouseout="this.style.background='transparent'">
            Meu perfil
        </a>
        <a href="#" id="btn-logout"
           style="display:block;padding:0.6rem 0.8rem;border-radius:6px;
                  color:#ff7088;text-decoration:none;font-size:0.88rem"
           onmouseover="this.style.background='rgba(228,64,95,0.08)'"
           onmouseout="this.style.background='transparent'">
            Sair
        </a>
    `;
    document.body.appendChild(menu);

    menu.querySelector('#btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        menu.remove();
        await Auth.logout();
    });

    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== anchor) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}
