/* ============================================================
   LES — View Membros
   ============================================================ */

import { api } from '../core/api.js';
import Auth from '../core/auth.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Membros' })) {
    throw new Error('Sem sessão');
}

/* ── Estado ── */
const state = {
    membros: [],
    cargos: [],
    filtros: { busca: '', cargo: '', status: '' },
    page: 0,
    size: 24,
    totalPages: 1
};

/* ── Elementos ── */
const container   = document.getElementById('membros-container');
const paginacao   = document.getElementById('membros-paginacao');
const inputBusca  = document.getElementById('filtro-busca');
const selCargo    = document.getElementById('filtro-cargo');
const selStatus   = document.getElementById('filtro-status');
const btnNovo     = document.getElementById('btn-novo-membro');

/* ── Helpers ── */
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2)
        .map(w => w[0]).join('').toUpperCase();
}

function avatarHtml(p) {
    if (p.fotoUrl) return `<img src="${p.fotoUrl}" alt="${esc(p.nome)}">`;
    return esc(initials(p.nome));
}

/* ── Carrega membros ── */
async function carregarMembros() {
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api.get('/membros', {
            query: {
                busca: state.filtros.busca || undefined,
                cargo: state.filtros.cargo || undefined,
                status: state.filtros.status || undefined,
                page: state.page,
                size: state.size
            }
        });

        state.membros = data?.content || data || [];
        state.totalPages = data?.totalPages || 1;
        renderMembros();
        renderPaginacao();
    } catch (err) {
        renderEmptyState(container, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os membros.');
    }
}

function renderMembros() {
    if (!state.membros.length) {
        renderEmptyState(container, 'Nenhum membro',
            'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'membros-grid';
    container.innerHTML = state.membros.map(m => `
        <div class="membro-card" data-id="${m.id}">
            <div class="membro-card-avatar">${avatarHtml(m)}</div>
            <div class="membro-card-info">
                <span class="membro-card-role">${esc(m.cargoPrincipal || 'Membro')}</span>
                <span class="membro-card-name">${esc(m.nome)}</span>
            </div>
            <svg class="membro-card-arrow" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        </div>
    `).join('');

    /* Abre modal de detalhe ao clicar */
    container.querySelectorAll('.membro-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalheMembro(card.dataset.id));
    });
}

function renderPaginacao() {
    if (!paginacao || state.totalPages <= 1) {
        if (paginacao) paginacao.innerHTML = '';
        return;
    }

    const btnPrev = `<button class="btn-ghost" ${state.page === 0 ? 'disabled' : ''} data-page="prev">Anterior</button>`;
    const btnNext = `<button class="btn-ghost" ${state.page >= state.totalPages - 1 ? 'disabled' : ''} data-page="next">Próxima</button>`;
    const info    = `<span style="font-size:0.85rem;color:var(--gray-lt);padding:0 .75rem">Página ${state.page + 1} de ${state.totalPages}</span>`;

    paginacao.innerHTML = btnPrev + info + btnNext;

    paginacao.querySelector('[data-page="prev"]')?.addEventListener('click', () => {
        if (state.page > 0) { state.page--; carregarMembros(); }
    });
    paginacao.querySelector('[data-page="next"]')?.addEventListener('click', () => {
        if (state.page < state.totalPages - 1) { state.page++; carregarMembros(); }
    });
}

/* ── Modal de detalhe ── */
async function abrirDetalheMembro(id) {
    Modal.open({
        title: 'Detalhes do membro',
        size: 'lg',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const m = await api.get(`/membros/${id}`);
        Modal.setContent(renderDetalheHtml(m));
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro ao carregar')}</p>`);
    }
}

function renderDetalheHtml(m) {
    const links = Object.entries(m.links || {})
        .map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener" class="btn-ghost" style="padding:.5rem 1rem;font-size:.75rem">${k}</a>`)
        .join('');

    return `
        <div class="membro-detalhe-head">
            <div class="membro-detalhe-avatar">${avatarHtml(m)}</div>
            <div>
                <h3 class="membro-detalhe-nome">${esc(m.nome)}</h3>
                <span class="membro-detalhe-cargo">${esc(m.cargoPrincipal || 'Membro')}</span>
            </div>
        </div>

        ${m.bio ? `
            <div class="membro-detalhe-section">
                <div class="membro-detalhe-section-title">Sobre</div>
                <p class="membro-detalhe-bio">${esc(m.bio)}</p>
            </div>` : ''}

        ${m.projetos?.length ? `
            <div class="membro-detalhe-section">
                <div class="membro-detalhe-section-title">Projetos</div>
                <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                    ${m.projetos.map(p => `<span class="badge badge-blue">${esc(p)}</span>`).join('')}
                </div>
            </div>` : ''}

        ${links ? `
            <div class="membro-detalhe-section">
                <div class="membro-detalhe-section-title">Links</div>
                <div class="membro-detalhe-links">${links}</div>
            </div>` : ''}
    `;
}

/* ── Filtros com debounce ── */
let timerBusca = null;
inputBusca?.addEventListener('input', (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        state.filtros.busca = e.target.value.trim();
        state.page = 0;
        carregarMembros();
    }, 400);
});

selCargo?.addEventListener('change', (e) => {
    state.filtros.cargo = e.target.value;
    state.page = 0;
    carregarMembros();
});

selStatus?.addEventListener('change', (e) => {
    state.filtros.status = e.target.value;
    state.page = 0;
    carregarMembros();
});

/* ── Carrega cargos para o filtro ── */
async function carregarCargos() {
    try {
        const cargos = await api.get('/cargos');
        const lista = Array.isArray(cargos) ? cargos : [];
        selCargo.innerHTML = '<option value="">Todos os cargos</option>' +
            lista.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
    } catch { /* silencioso */ }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    carregarCargos();
    carregarMembros();
});
if (document.readyState !== 'loading') {
    carregarCargos();
    carregarMembros();
}
