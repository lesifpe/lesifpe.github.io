/* ============================================================
   LES — App Shell
   Monta sidebar + topbar + guards + session watcher
   ============================================================ */

import Auth from '../core/auth.js';
import { requireAuth, applyPermVisibility } from '../core/guards.js';
import { startSessionWatcher } from '../core/session.js';
import { renderSidebar, initSidebarMobile } from './sidebar.js';
import { renderTopbar } from './topbar.js';

export function initAppShell({ title = '', requiredPerm = null } = {}) {
    if (!requireAuth()) return false;

    if (requiredPerm && !Auth.hasPerm(requiredPerm)) {
        window.location.href = '/app/dashboard.html?forbidden=1';
        return false;
    }

    const sidebarEl = document.querySelector('[data-sidebar]');
    const topbarEl  = document.querySelector('[data-topbar]');

    if (sidebarEl) renderSidebar(sidebarEl);
    if (topbarEl)  renderTopbar(topbarEl, { title });

    initSidebarMobile();
    applyPermVisibility();
    startSessionWatcher();

    document.body.classList.add('app-body');
    return true;
}
