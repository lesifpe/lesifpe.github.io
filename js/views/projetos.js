/* ============================================================
   LES — View Projetos
   ============================================================ */

import { api } from '../core/api.js';
import Auth from '../core/auth.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Projetos' })) {
    throw new Error('Sem sessão');
}

const container  = document.getElementById('projetos-container');
const inputBusca = document.getElementById('filtro-busca');
const selStatus  = document.getElementById('filtro-status');
const btnNovo    = document.getElementById('btn-novo-projeto');

const state = {
    projetos: [],
    filtros: { busca: '', status: '' }
};

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

function iniciaisProjeto(nome) {
    if (!nome) return '?';
    const words = nome.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const STATUS_LABELS = {
    EM_ANDAMENTO: { label: 'Em andamento', badge: 'badge-green' },
    CONCLUIDO:    { label: 'Concluído',    badge: 'badge-blue' },
    PAUSADO:      { label: 'Pausado',      badge: 'badge-gold' },
    PLANEJADO:    { label: 'Planejado',    badge: 'badge-gray' }
};

function statusBadge(status) {
    const info = STATUS_LABELS[status] || { label: status || '—', badge: 'badge-gray' };
    return `<span class="badge ${info.badge}">${esc(info.label)}</span>`;
}

/* ── Carregar ── */
async function carregarProjetos() {
    container.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await api.get('/projetos', {
            query: {
                busca: state.filtros.busca || undefined,
                status: state.filtros.status || undefined
            }
        });
        state.projetos = data?.content || data || [];
        renderProjetos();
    } catch (err) {
        renderEmptyState(container, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os projetos.');
    }
}

function renderProjetos() {
    if (!state.projetos.length) {
        renderEmptyState(container, 'Nenhum projeto',
            'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'projetos-grid';
    container.innerHTML = state.projetos.map(p => {
        const membros = p.membros || [];
        const visiveis = membros.slice(0, 3);
        const resto = membros.length - visiveis.length;

        const membrosHtml = visiveis.map(m => `
            <div class="avatar avatar-sm">
                ${m.fotoUrl
                    ? `<img src="${m.fotoUrl}" alt="${esc(m.nome)}">`
                    : esc(initials(m.nome))}
            </div>`).join('') +
            (resto > 0 ? `<span class="projeto-card-membros-mais">+${resto}</span>` : '');

        const stack = (p.stack || []).slice(0, 4);

        return `
            <div class="projeto-card" data-id="${p.id}">
                <div class="projeto-card-head">
                    <span class="projeto-card-icon">${esc(iniciaisProjeto(p.nome))}</span>
                    <span class="projeto-card-badge">${statusBadge(p.status)}</span>
                </div>
                <div class="projeto-card-body">
                    <h3 class="projeto-card-title">${esc(p.nome)}</h3>
                    <p class="projeto-card-desc">${esc(p.descricao || 'Sem descrição.')}</p>
                    ${stack.length ? `
                        <div class="projeto-card-stack">
                            ${stack.map(s => `<span>${esc(s)}</span>`).join('')}
                        </div>` : ''}
                    <div class="projeto-card-footer">
                        <div class="projeto-card-membros">${membrosHtml || '<span style="font-size:.75rem;color:var(--gray-lt)">Sem membros</span>'}</div>
                        ${p.repoUrl ? `
                            <a href="${p.repoUrl}" target="_blank" rel="noopener"
                               class="projeto-card-link" onclick="event.stopPropagation()">
                                Repositório
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="2.5"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.projeto-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalheProjeto(card.dataset.id));
    });
}

/* ── Detalhe ── */
async function abrirDetalheProjeto(id) {
    Modal.open({
        title: 'Detalhes do projeto',
        size: 'xl',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const p = await api.get(`/projetos/${id}`);
        Modal.setContent(renderDetalheHtml(p));
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`);
    }
}

function renderDetalheHtml(p) {
    const membros = (p.membros || []).map(m => `
        <div class="projeto-detalhe-membro" data-membro-id="${m.id}">
            <div class="avatar avatar-sm">
                ${m.fotoUrl
                    ? `<img src="${m.fotoUrl}" alt="${esc(m.nome)}">`
                    : esc(initials(m.nome))}
            </div>
            <div class="projeto-detalhe-membro-info">
                <span class="projeto-detalhe-membro-nome">${esc(m.nome)}</span>
                <span class="projeto-detalhe-membro-papel">${esc(m.papel || 'Membro')}</span>
            </div>
        </div>
    `).join('');

    return `
        <div class="projeto-detalhe-head">
            <h2 class="projeto-detalhe-titulo">${esc(p.nome)}</h2>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                ${statusBadge(p.status)}
                ${(p.stack || []).map(s => `<span class="badge badge-blue">${esc(s)}</span>`).join('')}
            </div>
        </div>

        ${p.descricao ? `
            <div class="projeto-detalhe-section">
                <div class="projeto-detalhe-section-title">Descrição</div>
                <p class="projeto-detalhe-desc">${esc(p.descricao)}</p>
            </div>` : ''}

        ${p.repoUrl ? `
            <div class="projeto-detalhe-section">
                <div class="projeto-detalhe-section-title">Repositório</div>
                <a href="${p.repoUrl}" target="_blank" rel="noopener" class="btn-ghost" style="padding:.5rem 1rem;font-size:.78rem">
                    Abrir no GitHub
                </a>
            </div>` : ''}

        ${membros ? `
            <div class="projeto-detalhe-section">
                <div class="projeto-detalhe-section-title">Equipe (${(p.membros || []).length})</div>
                <div class="projeto-detalhe-membros">${membros}</div>
            </div>` : ''}
    `;
}

/* ── Novo projeto ── */
btnNovo?.addEventListener('click', () => {
    Modal.open({
        title: 'Novo projeto',
        size: 'lg',
        content: `
            <form id="form-projeto">
                <div class="form-field">
                    <label for="proj-nome">Nome</label>
                    <input type="text" id="proj-nome" required placeholder="Ex: Portal LES-IFPE">
                </div>
                <div class="form-field">
                    <label for="proj-desc">Descrição</label>
                    <textarea id="proj-desc" rows="3" placeholder="Objetivo do projeto..."></textarea>
                </div>
                <div class="form-field">
                    <label for="proj-stack">Stack (separe por vírgula)</label>
                    <input type="text" id="proj-stack" placeholder="React, Node, PostgreSQL">
                </div>
                <div class="form-field">
                    <label for="proj-repo">URL do repositório</label>
                    <input type="url" id="proj-repo" placeholder="https://github.com/...">
                </div>
                <div class="form-field">
                    <label for="proj-status">Status</label>
                    <select id="proj-status">
                        <option value="PLANEJADO">Planejado</option>
                        <option value="EM_ANDAMENTO" selected>Em andamento</option>
                        <option value="PAUSADO">Pausado</option>
                        <option value="CONCLUIDO">Concluído</option>
                    </select>
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="criar">Criar projeto</button>
        `
    });

    const body = Modal.getBody();
    const footer = body?.parentElement?.querySelector('.les-modal-footer');

    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="criar"]')
        ?.addEventListener('click', async () => {
            const form = document.getElementById('form-projeto');
            const nome = form.querySelector('#proj-nome').value.trim();
            if (!nome) { toast.error('Campo obrigatório', 'Informe o nome.'); return; }

            const payload = {
                nome,
                descricao: form.querySelector('#proj-desc').value.trim(),
                stack: form.querySelector('#proj-stack').value
                    .split(',').map(s => s.trim()).filter(Boolean),
                repoUrl: form.querySelector('#proj-repo').value.trim(),
                status: form.querySelector('#proj-status').value
            };

            try {
                await api.post('/projetos', payload);
                toast.success('Projeto criado', nome);
                Modal.close();
                carregarProjetos();
            } catch (err) {
                toast.error('Erro ao criar', err?.message || 'Tente novamente.');
            }
        });
});

/* ── Filtros ── */
let timerBusca = null;
inputBusca?.addEventListener('input', (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        state.filtros.busca = e.target.value.trim();
        carregarProjetos();
    }, 400);
});

selStatus?.addEventListener('change', (e) => {
    state.filtros.status = e.target.value;
    carregarProjetos();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', carregarProjetos);
if (document.readyState !== 'loading') carregarProjetos();
