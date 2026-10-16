/* ============================================================
   LES — Toast / Notificações
   ============================================================
   Uso:
     import toast from '../core/toast.js';
     toast.success('Salvo!', 'Alterações aplicadas');
     toast.error('Erro', 'Verifique os campos');
   ============================================================ */

const CFG = window.LES_CONFIG;
let toastEl = null;
let hideTimer = null;

function ensureToast() {
    if (toastEl && document.body.contains(toastEl)) return toastEl;

    toastEl = document.createElement('div');
    toastEl.id = 'les-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.innerHTML = `
        <span class="les-toast-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
            </svg>
        </span>
        <div class="les-toast-body">
            <span class="les-toast-title"></span>
            <span class="les-toast-sub"></span>
        </div>
    `;
    document.body.appendChild(toastEl);
    return toastEl;
}

function show(type, title, message, timeout) {
    const el = ensureToast();
    el.classList.toggle('error', type === 'error');

    el.querySelector('.les-toast-icon').innerHTML = type === 'error'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
           </svg>`;

    el.querySelector('.les-toast-title').textContent = title || '';
    el.querySelector('.les-toast-sub').textContent   = message || '';

    /* Reseta animação */
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(
        () => el.classList.remove('show'),
        timeout ?? CFG.TOAST_TIMEOUT
    );
}

const toast = {
    success: (title, msg, timeout) => show('success', title, msg, timeout),
    error:   (title, msg, timeout) => show('error',   title, msg, timeout),
    info:    (title, msg, timeout) => show('success', title, msg, timeout)
};

export default toast;
export { toast };
