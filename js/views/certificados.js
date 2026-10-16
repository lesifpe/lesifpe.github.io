/* ============================================================
   LES — View Certificados
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Certificados' })) {
    throw new Error('Sem sessão');
}

const totalEl    = document.getElementById('cert-total');
const mesEl      = document.getElementById('cert-mes');
const listaEl    = document.getElementById('cert-lista');
const buscaEl    = document.getElementById('filtro-busca');
const selEvento  = document.getElementById('filtro-evento');
const btnLote    = document.getElementById('btn-emitir-lote');

const state = {
    certificados: [],
    eventos: [],
    filtros: { busca: '', eventoId: '' }
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function fmtDataCurta(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return iso; }
}

/* ── Emitir em lote ── */
btnLote?.addEventListener('click', () => {
    const opcoes = state.eventos.map(e =>
        `<option value="${e.id}">${esc(e.titulo)}</option>`).join('');

    if (!opcoes) {
        toast.error('Sem eventos', 'Cadastre um evento antes de emitir certificados.');
        return;
    }

    Modal.open({
        title: 'Emissão em lote',
        size: 'lg',
        content: `
            <form id="form-lote">
                <div class="form-field">
                    <label for="lote-evento">Evento</label>
                    <select id="lote-evento" required>
                        <option value="">Selecione...</option>
                        ${opcoes}
                    </select>
                </div>

                <div id="lote-participantes-wrap" style="margin-top:1rem"></div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="emitir" disabled>Emitir certificados</button>
        `
    });

    const form = document.getElementById('form-lote');
    const selEv = form.querySelector('#lote-evento');
    const wrap = document.getElementById('lote-participantes-wrap');
    const footer = Modal.getBody()?.parentElement?.querySelector('.les-modal-footer');
    const btnEmitir = footer?.querySelector('[data-acao="emitir"]');

    /* Ao escolher evento, carrega participantes */
    selEv.addEventListener('change', async () => {
        const id = selEv.value;
        if (!id) { wrap.innerHTML = ''; btnEmitir.disabled = true; return; }

        wrap.innerHTML = '<div class="spinner"></div>';

        try {
            const evento = await api.get(`/eventos/${id}`);
            const inscritos = evento.inscritosLista || evento.participantes || [];

            if (!inscritos.length) {
                wrap.innerHTML = `
                    <p style="color:var(--gray-lt);text-align:center;padding:1rem">
                        Este evento não possui participantes inscritos.
                    </p>`;
                btnEmitir.disabled = true;
                return;
            }

            wrap.innerHTML = `
                <div class="cert-lote-evento">
                    <div class="cert-lote-evento-titulo">${esc(evento.titulo)}</div>
                    <div class="cert-lote-evento-meta">
                        ${inscritos.length} participante(s) elegível(is)
                    </div>
                </div>
                <div class="cert-lote-lista">
                    ${inscritos.map(p => `
                        <label class="cert-lote-item">
                            <input type="checkbox" class="lote-check" value="${p.id}" checked>
                            <span>${esc(p.nome)}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            btnEmitir.disabled = false;

            /* Atualiza estado do botão conforme seleção */
            wrap.querySelectorAll('.lote-check').forEach(cb => {
                cb.addEventListener('change', () => {
                    const algum = wrap.querySelectorAll('.lote-check:checked').length > 0;
                    btnEmitir.disabled = !algum;
                });
            });
        } catch (err) {
            wrap.innerHTML = `<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`;
            btnEmitir.disabled = true;
        }
    });

    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    btnEmitir?.addEventListener('click', async () => {
        const eventoId = selEv.value;
        const selecionados = Array.from(wrap.querySelectorAll('.lote-check:checked'))
            .map(cb => cb.value);

        if (!eventoId || !selecionados.length) {
            toast.error('Selecione participantes', '');
            return;
        }

        btnEmitir.disabled = true;
        btnEmitir.textContent = `Emitindo ${selecionados.length}...`;

        try {
            await api.post('/certificados/emitir', {
                eventoId,
                usuarioIds: selecionados
            });
            toast.success('Emitidos', `${selecionados.length} certificados gerados.`);
            Modal.close();
            carregarCertificados();
        } catch (err) {
            toast.error('Erro na emissão', err?.message || 'Tente novamente.');
            btnEmitir.disabled = false;
            btnEmitir.textContent = 'Emitir certificados';
        }
    });
});

/* ── Filtros ── */
let timerBusca = null;
buscaEl?.addEventListener('input', (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        state.filtros.busca = e.target.value.trim();
        carregarCertificados();
    }, 400);
});

selEvento?.addEventListener('change', (e) => {
    state.filtros.eventoId = e.target.value;
    carregarCertificados();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    carregarEventos();
    carregarCertificados();
});
if (document.readyState !== 'loading') {
    carregarEventos();
    carregarCertificados();
}
