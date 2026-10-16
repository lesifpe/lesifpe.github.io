/* ============================================================
   LES — Autenticação
   ============================================================
   Uso:
     import Auth from '../core/auth.js';
     await Auth.login('email', 'senha');
     Auth.hasPerm('MEMBRO_CRIAR');
     Auth.requireAuth();
     await Auth.logout();
   ============================================================ */

import { api, TokenStore } from './api.js';

const CFG = window.LES_CONFIG;

const Auth = {
    /* ─────────────────────────────────────────────────────────
       Estado
    ───────────────────────────────────────────────────────── */

    get user() { return TokenStore.getUser(); },
    set user(u) { TokenStore.setUser(u); },

    isAuthenticated() {
        return TokenStore.hasSession() && !!this.user;
    },

    /* ─────────────────────────────────────────────────────────
       Permissões
    ───────────────────────────────────────────────────────── */

    hasPerm(perm) {
        const list = this.user?.permissoes || [];
        return list.includes(perm);
    },

    hasAnyPerm(...perms) {
        return perms.some(p => this.hasPerm(p));
    },

    hasAllPerms(...perms) {
        return perms.every(p => this.hasPerm(p));
    },

    /** Maior nível de cargo do usuário (0-100). Usado para RBAC hierárquico. */
    nivelMax() {
        return this.user?.nivelMax ?? 0;
    },

    isNivelMin(nivel) {
        return this.nivelMax() >= nivel;
    },

    isPresidente() { return this.nivelMax() >= 100; },
    isVice()       { return this.nivelMax() >= 90;  },

    /* ─────────────────────────────────────────────────────────
       Login / Logout
    ───────────────────────────────────────────────────────── */

    async login(email, senha) {
        const data = await api.post('/auth/login', { email, senha });

        TokenStore.set({ access: data.access, refresh: data.refresh });

        const user = {
            id:              data.user?.id,
            nome:            data.user?.nome,
            email:           data.user?.email,
            fotoUrl:         data.user?.fotoUrl,
            cargoPrincipal:  data.user?.cargoPrincipal,
            permissoes:      data.user?.permissoes || [],
            nivelMax:        data.user?.nivelMax ?? 0,
            primeiroAcesso:  data.user?.primeiroAcesso ?? false
        };

        this.user = user;
        return user;
    },

    /** Busca dados atualizados do usuário logado (GET /auth/me). */
    async refreshMe() {
        const data = await api.get('/auth/me');
        const user = {
            ...this.user,
            ...data,
            permissoes: data.permissoes || this.user?.permissoes || [],
            nivelMax:   data.nivelMax ?? this.user?.nivelMax ?? 0
        };
        this.user = user;
        return user;
    },

    async logout({ redirect = true } = {}) {
        try { await api.post('/auth/logout', {}); }
        catch { /* ignora se falhar */ }

        TokenStore.clear();

        if (redirect) {
            window.location.href = '/login.html';
        }
    },

    /* ─────────────────────────────────────────────────────────
       Recuperação de senha
    ───────────────────────────────────────────────────────── */

    async esqueciSenha(email) {
        return api.post('/auth/esqueci-senha', { email });
    },

    async redefinirSenha(token, novaSenha) {
        return api.post('/auth/redefinir-senha', { token, novaSenha });
    },

    async primeiroAcesso(token, novaSenha) {
        const data = await api.post('/auth/primeiro-acesso', { token, novaSenha });
        if (data?.access) {
            TokenStore.set({ access: data.access, refresh: data.refresh });
            this.user = data.user;
        }
        return data;
    },

    /* ─────────────────────────────────────────────────────────
       Guards de rota
    ───────────────────────────────────────────────────────── */

    /** Redireciona para login se não autenticado. Retorna true se ok. */
    requireAuth() {
        if (this.isAuthenticated()) return true;

        const next = encodeURIComponent(location.pathname + location.search);
        window.location.href = `/login.html?next=${next}`;
        return false;
    },

    /** Exige pelo menos uma das permissões. */
    requirePerm(...perms) {
        if (!this.requireAuth()) return false;

        if (!this.hasAnyPerm(...perms)) {
            window.location.href = '/app/dashboard.html?forbidden=1';
            return false;
        }
        return true;
    },

    /** Exige nível mínimo (RBAC hierárquico). */
    requireNivel(nivel) {
        if (!this.requireAuth()) return false;

        if (!this.isNivelMin(nivel)) {
            window.location.href = '/app/dashboard.html?forbidden=1';
            return false;
        }
        return true;
    }
};

export default Auth;
export { Auth };
