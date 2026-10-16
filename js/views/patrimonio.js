/* ============================================================
   LES — View Patrimônio
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Patrimônio' })) {
    throw new Error('Sem sessão');
}

const totalEl   = document.getElementById('pat-total');
const emUsoEl   = document.getElementById('pat-em-uso');
const valorEl   = document.getElementById('pat-valor');
const container = document.getElementById('patrimonio-container');
const buscaEl   = document.getElementById('filtro-busca');
const selCat    = document.getElementById('filtro-categoria');
const selEst    = document.getElementById('filtro-estado');
const btnNovo   = document.getElementById('btn-novo-item');

const state = {
    itens: [],
    filtros: { busca: '', categoria: '', estado: '' }
};

const CAT_LABELS = {
    ELETRONICO: 'Eletrônico',
    MOBILIARIO: 'Mobiliário',
    LIVRO:      'Livro',
    FERRAMENTA: 'Ferramenta',
    OUTRO:      'Outro'
};

const EST_LABELS = {
    DISPONIVEL: { label: 'Disponível',    badge: 'badge-green' },
    EM_USO:     { label: 'Em uso',        badge: 'badge-blue' },
    MANUTENCAO: { label: 'Em manutenção', badge: 'badge-gold' },
    DESCARTADO: { label: 'Descartado',    badge: 'badge-gray' }
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
            day: '2-digit', month: 'short', year: '2-digit'
        });
    } catch { return iso; }
}

/* ── Carregar ── */
async function carregarItens() {
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api.get('/patrimonio', {
            query: {
                busca: state.filtros.busca || undefined,
                categoria: state.filtros.categoria || undefined,
                estado: state.filtros.estado || undefined
            }
        });
        state.itens = data?.content || data || [];
        renderItens();
        atualizarKPIs();
    } catch (err) {
        renderEmptyState(container, 'Erro', err?.message || 'Não foi possível carregar.');
    }
}

function atualizarKPIs() {
    const total = state.itens.length;
    const emUso = state.itens.filter(i => i.estado === 'EM_USO').length;
    const valor = state.itens.reduce((s, i) => s + (i.valorAquisicao || 0), 0);

    totalEl.textContent = total;
    emUsoEl.textContent = emUso;
    valorEl.textContent = fmtMoeda(valor);
}

function renderItens() {
    if (!state.itens.length) {
        renderEmptyState(container, 'Sem itens', 'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'patrimonio-grid';
    container.innerHTML = state.itens.map(i => {
        const est = EST_LABELS[i.estado] || { label: i.estado || '—', badge: 'badge-gray' };

        return `
            <div class="patrimonio-card" data-id="${i.id}">
                <div class="patrimonio-card-head">
                    <div class="patrimonio-card-info">
                        <div class="patrimonio-card-nome">${esc(i.nome)}</div>
                        <div class="patrimonio-card-cat">${esc(CAT_LABELS[i.categoria] || i.categoria || '—')}</div>
                    </div>
                    <span class="badge ${est.badge}">${esc(est.label)}</span>
                </div>

                <div class="patrimonio-card-meta">
                    <div class="patrimonio-card-meta-item">
                        <span>Valor</span>
                        <strong>${fmtMoeda(i.valorAquisicao)}</strong>
                    </div>
                    <div class="patrimonio-card-meta-item">
                        <span>Adquirido em</span>
                        <span>${fmtDataCurta(i.dataAquisicao)}</span>
                    </div>
                    <div class="patrimonio-card-meta-item">
                        <span>Responsável</span>
                        <span>${esc(i.responsavel?.nome || '—')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.patrimonio-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalhe(card.dataset.id));
    });
}

async function abrirDetalhe(id) {
    Modal.open({
        title: 'Detalhes do item',
        size: 'lg',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const i = await api.get(`/patrimonio/${id}`);
        const est = EST_LABELS[i.estado] || { label: i.estado, badge: 'badge-gray' };
        const movs = i.movimentacoes || [];

        Modal.setContent(`
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,.07)">
                <div>
                    <h3 style="font-family:var(--font-head);font-size:1.3rem;color:var(--white);margin-bottom:.35rem">
                        ${esc(i.nome)}
                    </h3>
                    <div style="font-size:.85rem;color:var(--gray-lt)">
                        ${esc(CAT_LABELS[i.categoria] || i.categoria)} · ${fmtMoeda(i.valorAquisicao)}
                    </div>
                </div>
                <span class="badge ${est.badge}">${esc(est.label)}</span>
            </div>

            ${i.descricao ? `<p style="color:rgba(245,245,240,.7);line-height:1.6;margin-bottom:1.25rem">${esc(i.descricao)}</p>` : ''}

            ${movs.length ? `
                <div style="margin-bottom:1.25rem">
                    <div style="font-family:var(--font-head);font-size:.68rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gray-lt);margin-bottom:.5rem">
                        Histórico de movimentações
                    </div>
                    <div class="mov-lista">
                        ${movs.map(m => `
                            <div class="mov-linha">
                                <span class="mov-linha-data">${fmtDataCurta(m.data)}</span>
                                <span class="mov-linha-desc">${esc(m.descricao)}</span>
                                <span class="mov-linha-autor">${esc(m.autor?.nome || '')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
        `);
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`);
    }
}

/* ── Novo item ── */
btnNovo?.addEventListener('click', () => {
    Modal.open({
        title: 'Novo item',
        size: 'lg',
        content: `
            <form id="form-pat">
                <div class="form-field">
                    <label for="pat-nome">Nome</label>
                    <input type="text" id="pat-nome" required placeholder="Ex: Notebook Dell">
                </div>

                <div class="form-row-2">
                    <div class="form-field">
                        <label for="pat-categoria">Categoria</label>
                        <select id="pat-categoria">
                            <option value="ELETRONICO">Eletrônico</option>
                            <option value="MOBILIARIO">Mobiliário</option>
                            <option value="LIVRO">Livro / Apostila</option>
                            <option value="FERRAMENTA">Ferramenta</option>
                            <option value="OUTRO">Outro</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="pat-estado">Estado</label>
                        <select id="pat-estado">
                            <option value="DISPONIVEL">Disponível</option>
                            <option value="EM_USO">Em uso</option>
                            <option value="MANUTENCAO">Em manutenção</option>
                            <option value="DESCARTADO">Descartado</option>
                        </select>
                    </div>
                </div>

                <div class="form-row-2">
                    <div class="form-field">
                        <label for="pat-valor">Valor (R$)</label>
                        <input type="number" id="pat-valor" min="0" step="0.01">
                    </div>
                    <div class="form-field">
                        <label for="pat-data">Data de aquisição</label>
                        <input type="date" id="pat-data">
                    </div>
                </div>

                <div class="form-field">
                    <label for="pat-desc">Descrição</label>
                    <textarea id="pat-desc" rows="3" placeholder="Detalhes do item..."></textarea>
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="salvar">Cadastrar</button>
        `
    });

    const form = document.getElementById('form-pat');
    form.querySelector('#pat-data').value = new Date().toISOString().slice(0, 10);

    const footer = Modal.getBody()?.parentElement?.querySelector('.les-modal-footer');
    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="salvar"]')
        ?.addEventListener('click', async () => {
            const nome = form.querySelector('#pat-nome').value.trim();
            if (!nome) { toast.error('Campo obrigatório', 'Informe o nome.'); return; }

            try {
                await api.post('/patrimonio', {
                    nome,
                    categoria: form.querySelector('#pat-categoria').value,
                    estado: form.querySelector('#pat-estado').value,
                    valorAquisicao: parseFloat(form.querySelector('#pat-valor').value) || 0,
                    dataAquisicao: form.querySelector('#pat-data').value,
                    descricao: form.querySelector('#pat-desc').value.trim()
                });
                toast.success('
cat << 'EOF' > app/certificados.html
<!DOCTYPE html>
<html lang="PT-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>Certificados · LES-IFPE</title>
    <link rel="icon" href="../assets/imagens/logos/leslogowithouttext.png" type="image/png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link rel="stylesheet" href="../css/tokens.css">
    <link rel="stylesheet" href="../css/components.css">
    <link rel="stylesheet" href="../css/app.css">
    <link rel="stylesheet" href="../css/certificados.css">
</head>

<body>

    <div class="app-shell">

        <aside class="app-sidebar" data-sidebar></aside>
        <header class="app-topbar" data-topbar></header>

        <main class="app-content">

            <div class="app-page-head">
                <div>
                    <h1 class="app-page-title">Certificados</h1>
                    <p class="app-page-sub">Emissão e consulta de certificados</p>
                </div>
                <div class="app-page-actions" data-perm="CERTIFICADO_EMITIR">
                    <button class="btn-solid" id="btn-emitir-lote">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2.5"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Emitir em lote
                    </button>
                </div>
            </div>

            <div class="certificados-kpis">
                <div class="kpi-card">
                    <div class="kpi-label">Total emitido</div>
                    <div class="kpi-value" id="cert-total">—</div>
                    <div class="kpi-meta">Certificados no sistema</div>
                </div>
                <div class="kpi-card" data-variant="blue">
                    <div class="kpi-label">Este mês</div>
                    <div class="kpi-value" id="cert-mes">—</div>
                    <div class="kpi-meta">Emitidos no mês</div>
                </div>
            </div>

            <div class="app-card">
                <div class="app-card-head">
                    <h3 class="app-card-title">Histórico de certificados</h3>
                </div>

                <div class="certificados-filters">
                    <input type="text" id="filtro-busca" placeholder="Buscar por código ou título...">
                    <select id="filtro-evento">
                        <option value="">Todos os eventos</option>
                    </select>
                </div>

                <div id="cert-lista">
                    <div class="spinner"></div>
                </div>
            </div>

        </main>
    </div>

    <script src="../js/config.js"></script>
    <script type="module" src="../js/views/certificados.js"></script>

</body>
</html>
