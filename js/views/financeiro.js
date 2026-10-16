/* ============================================================
   LES — View Financeiro
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Financeiro', requiredPerm: 'FINANCEIRO_VER' })) {
    throw new Error('Sem permissão');
}

const saldoEl       = document.getElementById('fin-saldo');
const receitasEl    = document.getElementById('fin-receitas');
const despesasEl    = document.getElementById('fin-despesas');
const listaEl       = document.getElementById('fin-lista');
const categoriasEl  = document.getElementById('fin-categorias');
const filtroTipo    = document.getElementById('filtro-tipo');
const filtroMes     = document.getElementById('filtro-mes');
const btnNovo       = document.getElementById('btn-novo-lancamento');

const state = {
    lancamentos: [],
    filtros: { tipo: '', mes: '' }
};

const CATEGORIAS = {
    RECEITA: ['Mensalidade', 'Patrocínio', 'Evento', 'Doação', 'Outro'],
    DESPESA: ['Material', 'Evento', 'Infraestrutura', 'Marketing', 'Outro']
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function fmtMoeda(v) {
    if (v == null) return 'R$ 0,00';
    return 'R$ ' + Number(v).toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}

function fmtDataCurta(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short'
        });
    } catch { return iso; }
}

/* ── Resumo geral ── */
async function carregarResumo() {
    try {
        const data = await api.get('/financeiro/resumo', {
            query: { mes: state.filtros.mes || undefined }
        });

        saldoEl.textContent    = fmtMoeda(data.saldo);
        receitasEl.textContent = fmtMoeda(data.receitas);
        despesasEl.textContent = fmtMoeda(data.despesas);

        renderCategorias(data.porCategoria || []);
    } catch {
        saldoEl.textContent = receitasEl.textContent = despesasEl.textContent = '—';
        renderEmptyState(categoriasEl, 'Sem dados', 'Não foi possível carregar o resumo.');
    }
}

function renderCategorias(categorias) {
    if (!categorias.length) {
        renderEmptyState(categoriasEl, 'Sem categorias', 'Nenhum lançamento ainda.');
        return;
    }

    const max = Math.max(...categorias.map(c => Math.abs(c.total || 0)), 1);

    categoriasEl.innerHTML = categorias.map(c => {
        const tipoCls = c.tipo === 'RECEITA' ? 'receita' : 'despesa';
        const pct = (Math.abs(c.total) / max) * 100;
        return `
            <div class="fin-cat-item">
                <span class="fin-cat-nome">${esc(c.categoria)}</span>
                <div class="fin-cat-bar">
                    <div class="fin-cat-bar-fill ${tipoCls}" style="width:${pct}%"></div>
                </div>
                <span class="fin-cat-valor ${tipoCls}">${fmtMoeda(c.total)}</span>
            </div>
        `;
    }).join('');
}

/* ── Lançamentos ── */
async function carregarLancamentos() {
    listaEl.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api.get('/financeiro/lancamentos', {
            query: {
                tipo: state.filtros.tipo || undefined,
                mes: state.filtros.mes || undefined
            }
        });
        state.lancamentos = data?.content || data || [];
        renderLancamentos();
    } catch (err) {
        renderEmptyState(listaEl, 'Erro', err?.message || 'Não foi possível carregar.');
    }
}

function renderLancamentos() {
    if (!state.lancamentos.length) {
        renderEmptyState(listaEl, 'Sem lançamentos', 'Nenhum lançamento com esses filtros.');
        return;
    }

    listaEl.innerHTML = state.lancamentos.map(l => {
        const tipoCls = l.tipo === 'RECEITA' ? 'receita' : 'despesa';
        const sinal = l.tipo === 'RECEITA' ? '+' : '−';
        return `
            <div class="fin-linha" data-id="${l.id}">
                <span class="fin-linha-data">${fmtDataCurta(l.data)}</span>
                <div class="fin-linha-info">
                    <div class="fin-linha-desc">${esc(l.descricao || '—')}</div>
                    <div class="fin-linha-cat">${esc(l.categoria || '—')}</div>
                </div>
                <span class="fin-linha-valor ${tipoCls}">${sinal} ${fmtMoeda(l.valor)}</span>
                <div class="fin-linha-actions">
                    <button class="btn-icon" data-acao="excluir" data-id="${l.id}" title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    listaEl.querySelectorAll('[data-acao="excluir"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            excluirLancamento(btn.dataset.id);
        });
    });
}

/* ── Novo lançamento ── */
btnNovo?.addEventListener('click', () => {
    Modal.open({
        title: 'Novo lançamento',
        size: 'lg',
        content: `
            <form id="form-fin">
                <div class="form-row-2">
                    <div class="form-field">
                        <label for="fin-tipo">Tipo</label>
                        <select id="fin-tipo">
                            <option value="RECEITA">Receita</option>
                            <option value="DESPESA">Despesa</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="fin-valor">Valor (R$)</label>
                        <input type="number" id="fin-valor" min="0" step="0.01" required>
                    </div>
                </div>

                <div class="form-row-2">
                    <div class="form-field">
                        <label for="fin-data">Data</label>
                        <input type="date" id="fin-data" required>
                    </div>
                    <div class="form-field">
                        <label for="fin-categoria">Categoria</label>
                        <select id="fin-categoria"></select>
                    </div>
                </div>

                <div class="form-field">
                    <label for="fin-desc">Descrição</label>
                    <input type="text" id="fin-desc" required placeholder="Ex: Mensalidade de outubro">
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="salvar">Lançar</button>
        `
    });

    const form = document.getElementById('form-fin');
    const selTipo = form.querySelector('#fin-tipo');
    const selCat = form.querySelector('#fin-categoria');
    const inputData = form.querySelector('#fin-data');

    /* Categorias dinâmicas */
    function atualizarCategorias() {
        const tipo = selTipo.value;
        selCat.innerHTML = CATEGORIAS[tipo].map(c => `<option>${c}</option>`).join('');
    }
    selTipo.addEventListener('change', atualizarCategorias);
    atualizarCategorias();

    /* Data padrão = hoje */
    inputData.value = new Date().toISOString().slice(0, 10);

    const footer = Modal.getBody()?.parentElement?.querySelector('.les-modal-footer');
    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="salvar"]')
        ?.addEventListener('click', async () => {
            const tipo = selTipo.value;
            const valor = parseFloat(form.querySelector('#fin-valor').value);
            const data = inputData.value;
            const categoria = selCat.value;
            const descricao = form.querySelector('#fin-desc').value.trim();

            if (!valor || !data || !descricao) {
                toast.error('Campos obrigatórios', 'Preencha valor, data e descrição.');
                return;
            }

            try {
                await api.post('/financeiro/lancamentos', {
                    tipo, valor, data, categoria, descricao
                });
                toast.success('Lançado', fmtMoeda(valor));
                Modal.close();
                carregarLancamentos();
                carregarResumo();
            } catch (err) {
                toast.error('Erro ao lançar', err?.message || 'Tente novamente.');
            }
        });
});

/* ── Excluir ── */
async function excluirLancamento(id) {
    if (!confirm('Excluir este lançamento?')) return;
    try {
        await api.delete(`/financeiro/lancamentos/${id}`);
        toast.success('Excluído', '');
        carregarLancamentos();
        carregarResumo();
    } catch (err) {
        toast.error('Erro', err?.message || 'Tente novamente.');
    }
}

/* ── Filtros ── */
filtroTipo?.addEventListener('change', (e) => {
    state.filtros.tipo = e.target.value;
    carregarLancamentos();
});

filtroMes?.addEventListener('change', (e) => {
    state.filtros.mes = e.target.value;
    carregarLancamentos();
    carregarResumo();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    carregarResumo();
    carregarLancamentos();
});
if (document.readyState !== 'loading') {
    carregarResumo();
    carregarLancamentos();
}
