/* ============================================================
   LES — Estado global leve
   ============================================================
   Uso:
     import Store from '../core/state.js';
     Store.set('membros', [...]);
     const unsub = Store.subscribe('membros', lista => render(lista));
     unsub(); // desinscreve
   ============================================================ */

const _state = {
    /* Coleções */
    membros:    [],
    projetos:   [],
    eventos:    [],
    cargos:     [],
    documentos: [],
    posts:      [],
    notificacoes: [],

    /* Estado de UI / carga */
    loading: {}, // { [key]: boolean }
    filters: {}, // { [key]: any }
    cache:   new Map()
};

const _listeners = new Map();

export const Store = {
    get(key) {
        return _state[key];
    },

    set(key, value) {
        _state[key] = value;
        (_listeners.get(key) || []).forEach(fn => {
            try { fn(value); }
            catch (err) { console.error('[Store subscriber]', err); }
        });
    },

    update(key, patch) {
        const current = _state[key];
        const next = (current && typeof current === 'object' && !Array.isArray(current))
            ? { ...current, ...patch }
            : patch;
        this.set(key, next);
    },

    push(key, item) {
        const arr = Array.isArray(_state[key]) ? _state[key] : [];
        this.set(key, [...arr, item]);
    },

    subscribe(key, fn) {
        if (!_listeners.has(key)) _listeners.set(key, []);
        _listeners.get(key).push(fn);

        return () => {
            const arr = _listeners.get(key) || [];
            const idx = arr.indexOf(fn);
            if (idx >= 0) arr.splice(idx, 1);
        };
    },

    /* ── Loading ── */
    setLoading(key, value) {
        _state.loading = { ..._state.loading, [key]: !!value };
    },

    isLoading(key) {
        return !!_state.loading[key];
    },

    /* ── Cache simples com TTL ── */
    cacheSet(key, value, ttlMs = 60000) {
        _state.cache.set(key, { value, expires: Date.now() + ttlMs });
    },

    cacheGet(key) {
        const entry = _state.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            _state.cache.delete(key);
            return null;
        }
        return entry.value;
    },

    cacheClear() {
        _state.cache.clear();
    },

    reset() {
        Object.keys(_state).forEach(k => {
            if (Array.isArray(_state[k])) _state[k] = [];
            else if (typeof _state[k] === 'object') _state[k] = {};
        });
        _state.cache = new Map();
        _listeners.clear();
    }
};

export default Store;
