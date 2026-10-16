/* ============================================================
   LES — View Horas
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Gestão de Horas' })) {
    throw new Error('Sem sessão');
}

const kpiTotal   = document.getElementById('horas-total');
const kpiMes     = document.getElementById('horas-mes');
const kpiSemana  = document.getElementById('horas-semana');
const lista      = document.getElementById('horas-lista');
const porProjeto = document.getElementById('horas-por-projeto');
const filtroProj = document.getElementById('filtro-projeto');
const filtroMes  = document.getElementById('filtro-mes');
const btnNova    = document.getElementById('btn-nova-hora');

const state = {
    lancamentos: [],
    projetos: [],
    filtros: { projetoId: '', mes: '' }
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
            day: '2-digit', month: 'short'
        });
    } catch { return iso; }
}

/* ── Carregar KPIs e resumo ── */
async function carregarResumo() {
    try {
        const data = await api.get('/horas/resumo');
        kpiTotal.textContent  = `${data.total ?? 0}h`;
        kpiMes.textContent    = `${data.mes ?? 0}h`;
        kpiSemana.textContent = `${data.semana ?? 0}h`;

        const projetos = data.porProjeto || [];
        renderPorProjeto(projetos);
    } catch {
        kpiTotal.textContent = kpiMes.textContent = kpiSemana.textContent = '—';
        renderEmptyState(porProjeto, 'Sem dados', 'Não foi possível carregar o resumo.');
    }
}

function renderPorProjeto(projetos) {
    if (!projetos.length) {
        renderEmptyState(porProjeto, 'Sem horas', 'Nenhuma hora registrada ainda.');
        return;
    }

    const max = Math.max(...projetos.map(p => p.horas || 0), 1);

    porProjeto.innerHTML = projetos.map(p => `
        <div class="horas-proj-item">
            <span class="horas-proj-nome">${esc(p.projeto)}</span>
            <div class="horas-proj-bar">
                <div class="horas-proj-bar-fill" style="width:${(p.horas / max) * 100}%"></div>
            </div>
            <span class="horas-proj-valor">${p.horas}h</span>
        </div>
    `).join('');
}

/* ── Carregar lançamentos ── */
async function carregarLancamentos() {
    lista.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api.get('/horas', {
            query: {
                projetoId: state.filtros.projetoId || undefined,
                mes: state.filtros.mes || undefined
            }
        });
        state.lancamentos = data?.content || data || [];
        renderLancamentos();
    } catch (err) {
        renderEmptyState(lista, 'Erro', err?.message || 'Não foi possível carregar.');
    }
}

function renderLancamentos() {
    if (!state.lancamentos.length) {
        renderEmptyState(lista, 'Sem lançamentos', 'Nenhuma hora registrada com esses filtros.');
        return;
    }

    lista.innerHTML = state.lancamentos.map(h => `
        <div class="hora-linha" data-id="${h.id}">
            <span class="hora-linha-data">${fmtDataCurta(h.data)}</span>
            <span class="hora-linha-projeto">${esc(h.projeto || '—')}</span>
            <span class="hora-linha-desc">${esc(h.descricao || '')}</span>
            <span class="hora-linha-qtd">${h.horas}<span>h</span></span>
            <div class="hora-linha-actions">
                <button class="btn-icon" data-acao="excluir" data-id="${h.id}" title="Excluir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    lista.querySelectorAll('[data-acao="excluir"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            excluirHora(btn.dataset.id);
        });
    });
}

/* ── Carregar lista de projetos para o select ── */
async function carregarProjetos() {
    try {
        const data = await api.get('/projetos', { query: { size: 100 } });
        state.projetos = data?.content || data || [];
        filtroProj.innerHTML = '<option value="">Todos os projetos</option>' +
            state.projetos.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('');
    } catch { /* silencioso */ }
}

/* ── Modal de novo lançamento ── */
btnNova?.addEventListener('click', () => {
    const opcoesProjetos = state.projetos.map(p =>
        `<option value="${p.id}">${esc(p.nome)}</option>`).join('');

    Modal.open({
        title: 'Lançar horas',
        size: 'lg',
        content: `
            <form id="form-hora">
                <div class="form-field">
                    <label for="hora-projeto">Projeto</label>
                    <select id="hora-projeto" required>
                        <option value="">Selecione...</option>
                        ${opcoesProjetos}
                    </select>
                </div>
                <div class="form-row-2">
                    <div class="form-field">
                        <label for="hora-data">Data</label>
                        <input type="date" id="hora-data" required>
                    </div>
                    <div class="form-field">
                        <label for="hora-qtd">Horas</label>
                        <input type="number" id="hora-qtd" min="0.5" max="24" step="0.5" required value="2">
                    </div>
                </div>
                <div class="form-field">
                    <label for="hora-desc">Descrição</label>
                    <textarea id="hora-desc" rows="3" placeholder="O que foi feito..."></textarea>
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="salvar">Lançar</button>
        `
    });

    const body = Modal.getBody();
    const footer = body?.parentElement?.querySelector('.les-modal-footer');

    /* Pré-preenche com data de hoje */
    setTimeout(() => {
        const inputData = document.getElementById('hora-data');
        if (inputData) inputData.value = new Date().toISOString().slice(0, 10);
    }, 50);

    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="salvar"]')
        ?.addEventListener('click', async () => {
            const form = document.getElementById('form-hora');
            const projetoId = form.querySelector('#hora-projeto').value;
            const data = form.querySelector('#hora-data').value;
            const horas = parseFloat(form.querySelector('#hora-qtd').value);

            if (!projetoId || !data || !horas) {
                toast.error('Campos obrigatórios', 'Preencha projeto, data e horas.');
                return;
            }

            try {
                await api.post('/horas', {
                    projetoId,
                    data,
                    horas,
                    descricao: form.querySelector('#hora-desc').value.trim()
                });
                toast.success('Lançado', `${horas}h registradas.`);
                Modal.close();
                carregarLancamentos();
                carregarResumo();
            } catch (err) {
                toast.error('Erro ao lançar', err?.message || 'Tente novamente.');
            }
        });
});

/* ── Excluir ── */
async function excluirHora(id) {
    if (!confirm('Excluir este lançamento?')) return;
    try {
        await api.delete(`/horas/${id}`);
        toast.success('Excluído', 'Lançamento removido.');
        carregarLancamentos();
        carregarResumo();
    } catch (err) {
        toast.error('Erro', err?.message || 'Tente novamente.');
    }
}

/* ── Filtros ── */
filtroProj?.addEventListener('change', (e) => {
    state.filtros.projetoId = e.target.value;
    carregarLancamentos();
});

filtroMes?.addEventListener('change', (e) => {
    state.filtros.mes = e.target.value;
    carregarLancamentos();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
    carregarResumo();
    carregarLancamentos();
});
if (document.readyState !== 'loading') {
    carregarProjetos();
    carregarResumo();
    carregarLancamentos();
}
