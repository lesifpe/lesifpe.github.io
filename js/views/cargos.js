/* ============================================================
   LES — View Cargos
   ============================================================ */

import { api } from '../core/api.js';
import Auth from '../core/auth.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Cargos', requiredPerm: 'CARGO_GERENCIAR' })) {
    throw new Error('Sem permissão');
}

const treeEl = document.getElementById('cargos-tree');
const btnNovo = document.getElementById('btn-novo-cargo');

let cargosCache = [];
let permissoesCache = [];

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* ── Carregar cargos ── */
async function carregarCargos() {
    treeEl.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await api.get('/cargos');
        cargosCache = Array.isArray(data) ? data : (data?.content || []);
        renderCargos();
    } catch (err) {
        renderEmptyState(treeEl, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os cargos.');
    }
}

function renderCargos() {
    if (!cargosCache.length) {
        renderEmptyState(treeEl, 'Nenhum cargo',
            'Crie o primeiro cargo da liga para começar.');
        return;
    }

    /* Ordena por nível desc */
    const ordenados = [...cargosCache].sort((a, b) => (b.nivel || 0) - (a.nivel || 0));

    treeEl.innerHTML = ordenados.map(c => {
        const perms = c.permissoes || [];
        return `
            <div class="cargo-node" data-id="${c.id}">
                <div class="cargo-node-head">
                    <div class="cargo-node-info">
                        <div class="cargo-node-nivel">${c.nivel ?? 0}</div>
                        <div class="cargo-node-content">
                            <div class="cargo-node-name">${esc(c.nome)}</div>
                            <div class="cargo-node-meta">
                                <span><strong>${c.membrosCount ?? 0}</strong> membros</span>
                                ${c.sistema ? '<span class="badge badge-gray">Sistema</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="cargo-node-actions">
                        <button class="btn-icon" data-acao="editar" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2"
                                 stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                        </button>
                        ${!c.sistema ? `
                            <button class="btn-icon btn-danger" data-acao="excluir" title="Excluir">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="2"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                </svg>
                            </button>` : ''}
                    </div>
                </div>
                ${perms.length ? `
                    <div class="cargo-perms">
                        ${perms.map(p => `<span class="cargo-perm-pill">${esc(p)}</span>`).join('')}
                    </div>` : ''}
            </div>
        `;
    }).join('');

    /* Listeners */
    treeEl.querySelectorAll('.cargo-node').forEach(node => {
        const id = node.dataset.id;
        node.querySelector('[data-acao="editar"]')?.addEventListener('click', () => abrirModalCargo(id));
        node.querySelector('[data-acao="excluir"]')?.addEventListener('click', () => confirmarExclusao(id));
    });
}

/* ── Salvar ── */
async function salvarCargo(id = null) {
    const form = document.getElementById('form-cargo');
    const nome = form.querySelector('#cargo-nome').value.trim();
    const nivel = parseInt(form.querySelector('#cargo-nivel').value, 10);

    if (!nome) { toast.error('Campo obrigatório', 'Informe o nome do cargo.'); return; }
    if (isNaN(nivel) || nivel < 0 || nivel > 100) {
        toast.error('Nível inválido', 'Use um número entre 0 e 100.');
        return;
    }

    const permissoes = Array.from(form.querySelectorAll('#perms-grid input:checked'))
        .map(i => i.value);

    const payload = { nome, nivel, permissoes };

    const btn = Modal.getBody()?.parentElement
        ?.querySelector('[data-acao="salvar"]');

    try {
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }

        if (id) {
            await api.put(`/cargos/${id}`, payload);
            toast.success('Cargo atualizado', nome);
        } else {
            await api.post('/cargos', payload);
            toast.success('Cargo criado', nome);
        }

        Modal.close();
        carregarCargos();
    } catch (err) {
        toast.error('Erro ao salvar', err?.message || 'Tente novamente.');
        if (btn) { btn.disabled = false; btn.textContent = id ? 'Salvar alterações' : 'Criar cargo'; }
    }
}

/* ── Excluir ── */
async function confirmarExclusao(id) {
    const cargo = cargosCache.find(c => String(c.id) === String(id));
    if (!cargo) return;

    Modal.open({
        title: 'Excluir cargo',
        content: `
            <p style="color:var(--gray-lt);line-height:1.6;margin-bottom:1.25rem">
                Tem certeza que deseja excluir o cargo
                <strong style="color:var(--white)">${esc(cargo.nome)}</strong>?
                Esta ação não pode ser desfeita.
            </p>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid btn-danger" data-acao="confirmar">Excluir</button>
        `
    });

    const modalBody = Modal.getBody();
    const modalFooter = modalBody?.parentElement?.querySelector('.les-modal-footer');

    modalFooter?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    modalFooter?.querySelector('[data-acao="confirmar"]')
        ?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Excluindo…';
            try {
                await api.delete(`/cargos/${id}`);
                toast.success('Cargo excluído', cargo.nome);
                Modal.close();
                carregarCargos();
            } catch (err) {
                toast.error('Erro ao excluir', err?.message || 'Tente novamente.');
                e.target.disabled = false;
                e.target.textContent = 'Excluir';
            }
        });
}

/* ── Init ── */
btnNovo?.addEventListener('click', () => abrirModalCargo(null));

document.addEventListener('DOMContentLoaded', carregarCargos);
if (document.readyState !== 'loading') carregarCargos();
