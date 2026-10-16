/* ============================================================
   LES — Componente Modal genérico
   ============================================================
   Uso:
     import Modal from '../components/modal.js';
     Modal.open({
         title: 'Novo membro',
         content: '<form>...</form>',
         size: 'lg',            // '' | 'lg' | 'xl'
         onClose: () => {}
     });
     Modal.close();
   ============================================================ */

let currentOverlay = null;
let onCloseCallback = null;

const Modal = {
    open({ title = '', content = '', size = '', footer = '', onClose = null } = {}) {
        this.close();

        const overlay = document.createElement('div');
        overlay.className = 'les-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const sizeClass = size ? `modal-${size}` : '';
        overlay.innerHTML = `
            <div class="les-modal-box ${sizeClass}">
                <button class="les-modal-close" aria-label="Fechar">&times;</button>
                ${title ? `<h2 class="les-modal-title">${title}</h2>` : ''}
                <div class="les-modal-body">${content}</div>
                ${footer ? `<div class="les-modal-footer" style="
                    margin-top:1.5rem;padding-top:1rem;
                    border-top:1px solid rgba(255,255,255,0.07);
                    display:flex;gap:0.6rem;justify-content:flex-end;
                ">${footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => overlay.classList.add('open'));

        const closeBtn = overlay.querySelector('.les-modal-close');
        closeBtn?.addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        currentOverlay = overlay;
        onCloseCallback = onClose;

        return overlay;
    },

    close() {
        if (!currentOverlay) return;
        const el = currentOverlay;
        el.classList.remove('open');
        setTimeout(() => {
            el.remove();
            if (!document.querySelector('.les-modal-overlay.open')) {
                document.body.style.overflow = '';
            }
        }, 250);
        currentOverlay = null;
        if (onCloseCallback) onCloseCallback();
        onCloseCallback = null;
    },

    isOpen() {
        return !!currentOverlay;
    },

    setContent(html) {
        const body = currentOverlay?.querySelector('.les-modal-body');
        if (body) body.innerHTML = html;
    },

    getBody() {
        return currentOverlay?.querySelector('.les-modal-body') || null;
    }
};

/* Fechar com ESC */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Modal.isOpen()) Modal.close();
});

export default Modal;
