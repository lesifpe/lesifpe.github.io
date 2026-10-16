/* ============================================================
   LES — API Client
   ============================================================
   Wrapper fetch que:
     - injeta o JWT em todas as requisições
     - renova o access token automaticamente em 401
     - padroniza erros em ApiError
     - aceita JSON e FormData

   Uso:
     import { api, ApiError } from '../core/api.js';
     const membros = await api.get('/membros', { query: { page: 0 } });
     await api.post('/projetos', { nome: 'X' });
   ============================================================ */

const CFG = window.LES_CONFIG;

/* ────────────────────────────────────────────────────────────
   TokenStore — encapsula localStorage
   ──────────────────────────────────────────────────────────── */
export const TokenStore = {
    get access()  { return localStorage.getItem(CFG.ACCESS_KEY);  },
    get refresh() { return localStorage.getItem(CFG.REFRESH_KEY); },

    set({ access, refresh }) {
        if (access)  localStorage.setItem(CFG.ACCESS_KEY,  access);
        if (refresh) localStorage.setItem(CFG.REFRESH_KEY, refresh);
    },

    setUser(user) {
        if (user) localStorage.setItem(CFG.USER_KEY, JSON.stringify(user));
        else      localStorage.removeItem(CFG.USER_KEY);
    },

    getUser() {
        try { return JSON.parse(localStorage.getItem(CFG.USER_KEY)); }
        catch { return null; }
    },

    clear() {
        localStorage.removeItem(CFG.ACCESS_KEY);
        localStorage.removeItem(CFG.REFRESH_KEY);
        localStorage.removeItem(CFG.USER_KEY);
    },

    hasSession() {
        return !!this.access && !!this.refresh;
    }
};

/* ────────────────────────────────────────────────────────────
   ApiError — erro padronizado
   ──────────────────────────────────────────────────────────── */
export class ApiError extends Error {
    constructor(status, code, message, details) {
        super(message || `Erro ${status}`);
        this.name    = 'ApiError';
        this.status  = status;
        this.code    = code;
        this.details = details || null;
    }

    isUnauthorized() { return this.status === 401; }
    isForbidden()    { return this.status === 403; }
    isNotFound()     { return this.status === 404; }
    isValidation()   { return this.status === 422 || this.status === 400; }
}

/* ────────────────────────────────────────────────────────────
   Refresh token (com fila para evitar chamadas paralelas)
   ──────────────────────────────────────────────────────────── */
let refreshPromise = null;

async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;

    const refresh = TokenStore.refresh;
    if (!refresh) {
        throw new ApiError(401, 'NO_REFRESH', 'Sessão sem refresh token.');
    }

    refreshPromise = fetch(`${CFG.API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
    })
    .then(async (res) => {
        if (!res.ok) throw new ApiError(res.status, 'REFRESH_FAIL', 'Refresh inválido.');
        return res.json();
    })
    .then((data) => {
        TokenStore.set(data);
        if (data.user) TokenStore.setUser(data.user);
        return data.access;
    })
    .finally(() => { refreshPromise = null; });

    return refreshPromise;
}

/* ────────────────────────────────────────────────────────────
   Helpers internos
   ──────────────────────────────────────────────────────────── */
function safeJson(text) {
    try { return JSON.parse(text); }
    catch { return text; }
}

function buildUrl(path, query) {
    const url = new URL(`${CFG.API_URL}${path}`);
    if (query && typeof query === 'object') {
        Object.entries(query).forEach(([k, v]) => {
            if (v === undefined || v === null || v === '') return;
            if (Array.isArray(v)) v.forEach(item => url.searchParams.append(k, item));
            else url.searchParams.append(k, v);
        });
    }
    return url.toString();
}

function buildHeaders(body, extra) {
    const headers = { ...(extra || {}) };
    if (!(body instanceof FormData) && body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    const token = TokenStore.access;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function buildBody(body) {
    if (body === undefined || body === null) return undefined;
    if (body instanceof FormData) return body;
    return JSON.stringify(body);
}

/* ────────────────────────────────────────────────────────────
   request — função central
   ──────────────────────────────────────────────────────────── */
async function request(method, path, opts = {}) {
    const {
        body,
        query,
        headers,
        retry = true,
        raw = false,
        signal
    } = opts;

    const url = buildUrl(path, query);
    const init = {
        method,
        headers: buildHeaders(body, headers),
        body: buildBody(body),
        signal
    };

    let response;
    try {
        response = await fetch(url, init);
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new ApiError(0, 'NETWORK_ERROR', 'Falha de conexão com o servidor.');
    }

    /* ── 401: tenta refresh uma vez ── */
    if (response.status === 401 && retry && TokenStore.refresh) {
        try {
            await refreshAccessToken();
            return request(method, path, { ...opts, retry: false });
        } catch {
            TokenStore.clear();
            const next = encodeURIComponent(location.pathname + location.search);
            window.location.href = `/login.html?expired=1&next=${next}`;
            throw new ApiError(401, 'SESSION_EXPIRED', 'Sessão expirada.');
        }
    }

    /* ── 204 sem corpo ── */
    if (response.status === 204) return null;

    /* ── Resposta crua (blob, stream) ── */
    if (raw) return response;

    const text = await response.text();
    const data = text ? safeJson(text) : null;

    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.code    || 'HTTP_ERROR',
            data?.message || `Erro ${response.status}`,
            data?.details
        );
    }

    return data;
}

/* ────────────────────────────────────────────────────────────
   API pública
   ──────────────────────────────────────────────────────────── */
export const api = {
    get:    (path, opts)       => request('GET',    path, opts || {}),
    post:   (path, body, opts) => request('POST',   path, { ...(opts || {}), body }),
    put:    (path, body, opts) => request('PUT',    path, { ...(opts || {}), body }),
    patch:  (path, body, opts) => request('PATCH',  path, { ...(opts || {}), body }),
    delete: (path, opts)       => request('DELETE', path, opts || {}),

    /* ── Upload multipart ── */
    upload: (path, formData, opts) => request('POST', path, { ...(opts || {}), body: formData }),

    /* ── Download / resposta crua ── */
    raw:    (path, opts) => request('GET', path, { ...(opts || {}), raw: true }),

    /* ── Expor helper para logout / refresh manual ── */
    refresh: refreshAccessToken
};

/* ── Alias para quem preferir importar direto ── */
export default api;
