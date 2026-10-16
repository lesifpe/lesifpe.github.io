/* ============================================================
   LES — Sidebar do painel
   ============================================================
   Gera a navegação lateral com:
     - Grupos (Principal, Gestão, Administrativo)
     - Itens filtrados por permissão (data-perm)
     - Item ativo baseado na URL atual
   ============================================================ */

import Auth from '../core/auth.js';

const MENU = [
    { group: 'Principal' },
    { id: 'dashboard',    label: 'Dashboard',    href: '/app/dashboard.html',    icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
    { id: 'feed',         label: 'Feed',         href: '/app/feed.html',         icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5' },
    { id: 'perfil',       label: 'Meu Perfil',   href: '/app/perfil.html',       icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zM3 22a9 9 0 0118 0' },

    { group: 'Gestão' },
    { id: 'membros',      label: 'Membros',      href: '/app/membros.html',      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z', perm: 'MEMBRO_CRIAR' },
    { id: 'cargos',       label: 'Cargos',       href: '/app/cargos.html',       icon: 'M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z', perm: 'CARGO_GERENCIAR' },
    { id: 'projetos',     label: 'Projetos',     href: '/app/projetos.html',     icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { id: 'eventos',      label: 'Eventos',      href: '/app/eventos.html',      icon: 'M8 2v4M16 2v4M3 10h18M5 6h14v14H5z' },
    { id: 'presenca',     label: 'Presença',     href: '/app/presenca.html',     icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
    { id: 'horas',        label: 'Horas',        href: '/app/horas.html',        icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2' },
    { id: 'documentos',   label: 'Documentos',   href: '/app/documentos.html',   icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },

    { group: 'Administrativo' },
    { id: 'financeiro',   label: 'Financeiro',   href: '/app/financeiro.html',   icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', perm: 'FINANCEIRO_VER' },
    { id: 'patrimonio',   label: 'Patrimônio',   href: '/app/patrimonio.html',   icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h6M9 13h6M9 17h6' },
    { id: 'certificados', label: 'Certificados', href: '/app/certificados.html', icon: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
];

function svgIcon(path) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="${path}"/>
            </svg>`;
}

export function renderSidebar(container) {
    if (!container) return;

    const currentPath = location.pathname;

    let html = `
        <div class="app-sidebar-brand">
            <img src="../../assets/imagens/logos/leslogowithouttext.png" alt="LES">
            <span class="brand-label">Portal<br>Interno</span>
        </div>
        <ul class="app-sidebar-nav">
    `;

    MENU.forEach(item => {
        if (item.group) {
            html += `<li class="app-nav-group">${item.group}</li>`;
            return;
        }

        if (item.perm && !Auth.hasPerm(item.perm)) return;

        const isActive = currentPath.endsWith(item.href.split('/').pop());
        html += `
            <li>
                <a href="${item.href}"
                   class="app-nav-item ${isActive ? 'active' : ''}"
                   data-route="${item.id}">
                    ${svgIcon(item.icon)}
                    <span>${item.label}</span>
                </a>
            </li>
        `;
    });

    html += `</ul>`;
    container.innerHTML = html;
}

export function initSidebarMobile() {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.app-sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth > 900) return;
        if (!sidebar.classList.contains('open')) return;
        if (sidebar.contains(e.target)) return;
        if (toggle.contains(e.target)) return;
        sidebar.classList.remove('open');
    });
}

export function renderSidebar(container) {
    if (!container) return;

    const currentPath = location.pathname;

    let html = `
        <div class="app-sidebar-brand">
            <img src="../../assets/imagens/logos/leslogowithouttext.png" alt="LES">
            <span class="brand-label">Portal<br>Interno</span>
        </div>
        <ul class="app-sidebar-nav">
    `;

    MENU.forEach(item => {
        if (item.group) {
            html += `<li class="app-nav-group">${item.group}</li>`;
            return;
        }

        if (item.perm && !Auth.hasPerm(item.perm)) return;

        const isActive = currentPath.endsWith(item.href.split('/').pop());
        html += `
            <li>
                <a href="${item.href}"
                   class="app-nav-item ${isActive ? 'active' : ''}"
                   data-route="${item.id}">
                    ${svgIcon(item.icon)}
                    <span>${item.label}</span>
                </a>
            </li>
        `;
    });

    html += `</ul>`;
    container.innerHTML = html;
}

export function initSidebarMobile() {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.app-sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth > 900) return;
        if (!sidebar.classList.contains('open')) return;
        if (sidebar.contains(e.target)) return;
        if (toggle.contains(e.target)) return;
        sidebar.classList.remove('open');
    });
}
