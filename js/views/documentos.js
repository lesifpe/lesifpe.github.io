/* ============================================================
   LES — View Documentos
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Documentação' })) {
    throw new Error('Sem sessão');
}

const container  = document.getElementById('docs-container');
const inputBusca = document.getElementById('filtro-busca');
const selTipo    = document.getElementById('filtro-tipo');
const btnNovo    = document.getElementById('btn-novo-doc');

const state = {
    docs: [],
    filtros: { busca: '', tipo: '' }
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const TIPO_LABELS = {
    ATA:      'Ata de reunião',
    DECISAO:  'Decisão',
    ROADMAP:  'Roadmap',
    POLITICA: 'Política',
    OUTRO:    'Outro'
};

const TIPO_ICONS = {
    ATA:      'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    DECISAO:  'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    ROADMAP:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    POLITICA: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    OUTRO:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6'
};

function fmtData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return iso; }
}

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2)
        .map(w => w[0]).join('').toUpperCase();
}

/* ── Carregar ── */
async function carregarDocs() {
    container.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await api.get('/documentos', {
            query: {
                busca: state.filtros.busca || undefined,
                tipo: state.filtros.tipo || undefined
            }
        });
        state.docs = data?.content || data || [];
        renderDocs();
    } catch (err) {
        renderEmptyState(container, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os documentos.');
    }
}

function renderDocs() {
    if (!state.docs.length) {
        renderEmptyState(container, 'Nenhum documento',
            'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'docs-grid';
    container.innerHTML = state.docs.map(d => `
        <div class="doc-card" data-id="${d.id}">
            <div class="doc-card-head">
                <div class="doc-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="${TIPO_ICONS[d.tipo] || TIPO_ICONS.OUTRO}"/>
                    </svg>
                </div>
                <div class="doc-card-info">
                    <div class="doc-card-titulo">${esc(d.titulo)}</div>
                    <div class="doc-card-tipo">${esc(TIPO_LABELS[d.tipo] || d.tipo || '—')}</div>
                </div>
            </div>
            ${d.descricao ? `<div class="doc-card-desc">${esc(d.descricao)}</div>` : ''}
            <div class="doc-card-footer">
                <div class="doc-card-autor">
                    <div class="avatar avatar-sm" style="width:22px;height:22px;font-size:.55rem">
                        ${d.autor?.fotoUrl
                            ? `<img src="${d.autor.fotoUrl}" alt="${esc(d.autor.nome)}">`
                            : esc(initials(d.autor?.nome))}
                    </div>
                    <span>${esc(d.autor?.nome || '—')}</span>
                </div>
                <span>${fmtData(d.criadoEm)}</span>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.doc-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalheDoc(card.dataset.id));
    });
}

/* ── Detalhe ── */
async function abrirDetalheDoc(id) {
    Modal.open({
        title: 'Detalhes do documento',
        size: 'lg',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const d = await api.get(`/documentos/${id}`);
        Modal.setContent(`
            <div class="doc-detalhe-head">
                <div class="doc-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="${TIPO_ICONS[d.tipo] || TIPO_ICONS.OUTRO}"/>
                    </svg>
                </div>
                <div>
                    <div class="doc-detalhe-titulo">${esc(d.titulo)}</div>
                    <div class="doc-detalhe-meta">
                        <span><strong>${esc(TIPO_LABELS[d.tipo] || d.tipo || '—')}</strong></span>
                        <span>·</span>
                        <span>${fmtData(d.criadoEm)}</span>
                        <span>·</span>
                        <span>por ${esc(d.autor?.nome || '—')}</span>
                    </div>
                </div>
            </div>

            ${d.descricao ? `<p class="doc-detalhe-desc">${esc(d.descricao)}</p>` : ''}

            <div class="doc-detalhe-actions">
                ${d.urlArquivo ? `
                    <a href="${d.urlArquivo}" target="_blank" rel="noopener" class="btn-solid">
                        Abrir / baixar
                    </a>` : ''}
                <button class="btn-ghost" onclick="history.back()" style="display:none"></button>
            </div>
        `);
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`);
    }
}

/* ── Carregar ── */
async function carregarDocs() {
    container.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await api.get('/documentos', {
            query: {
                busca: state.filtros.busca || undefined,
                tipo: state.filtros.tipo || undefined
            }
        });
        state.docs = data?.content || data || [];
        renderDocs();
    } catch (err) {
        renderEmptyState(container, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os documentos.');
    }
}

function renderDocs() {
    if (!state.docs.length) {
        renderEmptyState(container, 'Nenhum documento',
            'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'docs-grid';
    container.innerHTML = state.docs.map(d => `
        <div class="doc-card" data-id="${d.id}">
            <div class="doc-card-head">
                <div class="doc-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="${TIPO_ICONS[d.tipo] || TIPO_ICONS.OUTRO}"/>
                    </svg>
                </div>
                <div class="doc-card-info">
                    <div class="doc-card-titulo">${esc(d.titulo)}</div>
                    <div class="doc-card-tipo">${esc(TIPO_LABELS[d.tipo] || d.tipo || '—')}</div>
                </div>
            </div>
            ${d.descricao ? `<div class="doc-card-desc">${esc(d.descricao)}</div>` : ''}
            <div class="doc-card-footer">
                <div class="doc-card-autor">
                    <div class="avatar avatar-sm" style="width:22px;height:22px;font-size:.55rem">
                        ${d.autor?.fotoUrl
                            ? `<img src="${d.autor.fotoUrl}" alt="${esc(d.autor.nome)}">`
                            : esc(initials(d.autor?.nome))}
                    </div>
                    <span>${esc(d.autor?.nome || '—')}</span>
                </div>
                <span>${fmtData(d.criadoEm)}</span>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.doc-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalheDoc(card.dataset.id));
    });
}

/* ── Detalhe ── */
async function abrirDetalheDoc(id) {
    Modal.open({
        title: 'Detalhes do documento',
        size: 'lg',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const d = await api.get(`/documentos/${id}`);
        Modal.setContent(`
            <div class="doc-detalhe-head">
                <div class="doc-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="${TIPO_ICONS[d.tipo] || TIPO_ICONS.OUTRO}"/>
                    </svg>
                </div>
                <div>
                    <div class="doc-detalhe-titulo">${esc(d.titulo)}</div>
                    <div class="doc-detalhe-meta">
                        <span><strong>${esc(TIPO_LABELS[d.tipo] || d.tipo || '—')}</strong></span>
                        <span>·</span>
                        <span>${fmtData(d.criadoEm)}</span>
                        <span>·</span>
                        <span>por ${esc(d.autor?.nome || '—')}</span>
                    </div>
                </div>
            </div>

            ${d.descricao ? `<p class="doc-detalhe-desc">${esc(d.descricao)}</p>` : ''}

            <div class="doc-detalhe-actions">
                ${d.urlArquivo ? `
                    <a href="${d.urlArquivo}" target="_blank" rel="noopener" class="btn-solid">
                        Abrir / baixar
                    </a>` : ''}
                <button class="btn-ghost" onclick="history.back()" style="display:none"></button>
            </div>
        `);
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`);
    }
}

/* ── Novo documento ── */
btnNovo?.addEventListener('click', () => {
    Modal.open({
        title: 'Publicar documento',
        size: 'lg',
        content: `
            <form id="form-doc">
                <div class="form-field">
                    <label for="doc-titulo">Título</label>
                    <input type="text" id="doc-titulo" required placeholder="Ex: Ata da reunião de outubro">
                </div>
                <div class="form-field">
                    <label for="doc-tipo">Tipo</label>
                    <select id="doc-tipo">
                        <option value="ATA">Ata de reunião</option>
                        <option value="DECISAO">Decisão</option>
                        <option value="ROADMAP">Roadmap</option>
                        <option value="POLITICA">Política</option>
                        <option value="OUTRO">Outro</option>
                    </select>
                </div>
                <div class="form-field">
                    <label for="doc-desc">Descrição / resumo</label>
                    <textarea id="doc-desc" rows="4" placeholder="Resumo do conteúdo..."></textarea>
                </div>
                <div class="form-field">
                    <label for="doc-arquivo">Arquivo (PDF, DOCX, etc.)</label>
                    <input type="file" id="doc-arquivo">
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="criar">Publicar</button>
        `
    });

    const body = Modal.getBody();
    const footer = body?.parentElement?.querySelector('.les-modal-footer');

    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="criar"]')
        ?.addEventListener('click', async () => {
            const form = document.getElementById('form-doc');
            const titulo = form.querySelector('#doc-titulo').value.trim();
            const tipo = form.querySelector('#doc-tipo').value;
            const desc = form.querySelector('#doc-desc').value.trim();
            const arquivo = form.querySelector('#doc-arquivo').files[0];

            if (!titulo) {
                toast.error('Campo obrigatório', 'Informe o título.');
                return;
            }

            const fd = new FormData();
            fd.append('titulo', titulo);
            fd.append('tipo', tipo);
            fd.append('descricao', desc);
            if (arquivo) fd.append('file', arquivo);

            try {
                await api.upload('/documentos', fd);
                toast.success('Publicado', titulo);
                Modal.close();
                carregarDocs();
            } catch (err) {
                toast.error('Erro ao publicar', err?.message || 'Tente novamente.');
            }
        });
});

/* ── Filtros ── */
let timerBusca = null;
inputBusca?.addEventListener('input', (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        state.filtros.busca = e.target.value.trim();
        carregarDocs();
    }, 400);
});

selTipo?.addEventListener('change', (e) => {
    state.filtros.tipo = e.target.value;
    carregarDocs();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', carregarDocs);
if (document.readyState !== 'loading') carregarDocs();
