/* ============================================================
   LES — Guards de rota (atalhos semânticos sobre Auth)
   ============================================================
   Uso:
     import { requireAuth, requirePerm, requireNivel } from '../core/guards.js';
     if (!requireAuth()) return;
     if (!requirePerm('MEMBRO_CRIAR')) return;
   ============================================================ */

import Auth from './auth.js';

/** Redireciona para login se não estiver autenticado. */
export function requireAuth() {
    return Auth.requireAuth();
}

/** Exige pelo menos uma das permissões. */
export function requirePerm(...perms) {
    return Auth.requirePerm(...perms);
}

/** Exige nível mínimo de cargo (0–100). */
export function requireNivel(nivel) {
    return Auth.requireNivel(nivel);
}

/** Exige que o usuário NÃO esteja logado (útil para /login.html). */
export function requireGuest(redirectTo) {
    if (!Auth.isAuthenticated()) return true;
    window.location.href = redirectTo || window.LES_CONFIG.DEFAULT_ROUTE;
    return false;
}

/** Mostra/oculta elementos conforme permissão. */
export function hideIfNoPerm(el, ...perms) {
    if (!el) return;
    if (Auth.hasAnyPerm(...perms)) el.hidden = false;
    else el.hidden = true;
}

/** Marca itens de menu com data-perm para ocultar quem não tem permissão. */
export function applyPermVisibility(root = document) {
    root.querySelectorAll('[data-perm]').forEach(el => {
        const perms = el.dataset.perm.split(',').map(s => s.trim()).filter(Boolean);
        if (!Auth.hasAnyPerm(...perms)) el.hidden = true;
        else el.hidden = false;
    });
}
