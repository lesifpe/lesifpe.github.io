/* ============================================================
   LES — Router SPA (hash-based)
   ============================================================
   Uso:
     import Router from '../core/router.js';
     Router.register('/', () => renderDashboard());
     Router.register('/perfil/:id', ({ id }) => renderPerfil(id));
     Router.init();
   ============================================================ */

const routes = [];
let notFoundHandler = () => {
    document.body.innerHTML = '<h1 style="color:#fff;padding:2rem">404</h1>';
};

/* ────────────────────────────────────────────────────────────
   Matching de rota com parâmetros (:id, :slug)
   ──────────────────────────────────────────────────────────── */
function matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts    = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
        const p = patternParts[i];
        const v = pathParts[i];
        if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(v);
        else if (p !== v) return null;
    }
    return params;
}

/* ────────────────────────────────────────────────────────────
   Router API
   ──────────────────────────────────────────────────────────── */
export const Router = {
    register(pattern, handler) {
        routes.push({ pattern, handler });
    },

    notFound(fn) { notFoundHandler = fn; },

    navigate(path, { replace = false, query } = {}) {
        let hash = '#' + path;
        if (query && typeof query === 'object') {
            const qs = new URLSearchParams(query).toString();
            if (qs) hash += '?' + qs;
        }
        if (replace) location.replace(hash);
        else location.hash = hash;
    },

    currentPath() {
        const raw = location.hash.slice(1) || '/';
        const [path] = raw.split('?');
        return path || '/';
    },

    currentQuery() {
        const raw = location.hash.slice(1) || '';
        const idx = raw.indexOf('?');
        if (idx < 0) return {};
        const params = new URLSearchParams(raw.slice(idx + 1));
        const obj = {};
        params.forEach((v, k) => { obj[k] = v; });
        return obj;
    },

    async resolve() {
        const path = this.currentPath();
        const query = this.currentQuery();

        for (const route of routes) {
            const params = matchRoute(route.pattern, path);
            if (params !== null) {
                try {
                    await route.handler({ ...params, ...query, path });
                } catch (err) {
                    console.error('[Router] handler error:', err);
                }
                return;
            }
        }

        try { await notFoundHandler(path); }
        catch (err) { console.error('[Router] notFound error:', err); }
    },

    init() {
        window.addEventListener('hashchange', () => this.resolve());
        // Resolve após DOMContentLoaded para garantir que o app montou
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.resolve());
        } else {
            this.resolve();
        }
    }
};

export default Router;
