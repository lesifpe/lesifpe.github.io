/* ============================================================
   LES — View Presença
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Presença', requiredPerm: 'PRESENCA_REGISTRAR' })) {
    throw new Error('Sem permissão');
}

const seletorEvento = document.getElementById('seletor-evento');
const content       = document.getElementById('presenca-content');

const state = {
    eventoId: null,
    evento: null,
    registros: []   // [{ usuarioId, nome, fotoUrl, presente }]
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

function avatarHtml(p) {
    if (p.fotoUrl) return `<img src="${p.fotoUrl}" alt="${esc(p.nome)}">`;
    return esc(initials(p.nome));
}

function fmtData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return iso; }
}

/* ── Carregar lista de eventos para o seletor ── */
async function carregarEventos() {
    try {
        const data = await api.get('/eventos', { query: { size: 100 } });
        const eventos = data?.content || data || [];

        seletorEvento.innerHTML = '<option value="">Selecione um evento</option>' +
            eventos.map(e => `<option value="${e.id}">${esc(e.titulo)} — ${fmtData(e.dataInicio)}</option>`).join('');
    } catch (err) {
        toast.error('Erro', 'Não foi possível carregar os eventos.');
    }
}

/* ── Carrega dados do evento + registros de presença ── */
async function carregarPresenca(eventoId) {
    content.innerHTML = '<div class="spinner"></div>';

    try {
        const [evento, inscricoes] = await Promise.all([
            api.get(`/eventos/${eventoId}`),
            api.get(`/presenca/evento/${eventoId}`).catch(() => [])
        ]);

        state.evento = evento;
        state.eventoId = eventoId;

        /* Se já existe registro de presença, usa. Senão, cria lista vazia
           a partir dos inscritos no evento. */
        const jaRegistrados = Array.isArray(inscricoes) ? inscricoes : [];
        const inscritos = evento.inscritosLista || evento.participantes || [];

        if (jaRegistrados.length) {
            state.registros = jaRegistrados.map(r => ({
                usuarioId: r.usuarioId,
                nome: r.nome,
                fotoUrl: r.fotoUrl,
                presente: r.presente === true
            }));
        } else if (inscritos.length) {
            state.registros = inscritos.map(u => ({
                usuarioId: u.id,
                nome: u.nome,
                fotoUrl: u.fotoUrl,
                presente: false
            }));
        } else {
            state.registros = [];
        }

        renderPresenca();
    } catch (err) {
        renderEmptyState(content, 'Erro',
            err?.message || 'Não foi possível carregar o evento.');
    }
}

/* ── Renderiza cabeçalho + stats + lista ── */
function renderPresenca() {
    const e = state.evento;
    const total = state.registros.length;
    const presentes = state.registros.filter(r => r.presente).length;
    const ausentes = total - presentes;

    content.innerHTML = `
        <div class="presenca-evento-head">
            <div class="presenca-evento-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
            </div>
            <div class="presenca-evento-info">
                <div class="presenca-evento-titulo">${esc(e.titulo)}</div>
                <div class="presenca-evento-meta">
                    <span>${fmtData(e.dataInicio)}</span>
                    ${e.local ? `<span>· ${esc(e.local)}</span>` : ''}
                </div>
            </div>
        </div>

        <div class="presenca-stats">
            <div class="presenca-stat">
                <div class="presenca-stat-value">${total}</div>
                <div class="presenca-stat-label">Inscritos</div>
            </div>
            <div class="presenca-stat">
                <div class="presenca-stat-value green" id="stat-presentes">${presentes}</div>
                <div class="presenca-stat-label">Presentes</div>
            </div>
            <div class="presenca-stat">
                <div class="presenca-stat-value red" id="stat-ausentes">${ausentes}</div>
                <div class="presenca-stat-label">Ausentes</div>
            </div>
            <div class="presenca-stat">
                <div class="presenca-stat-value gray" id="stat-taxa">
                    ${total ? Math.round((presentes / total) * 100) : 0}%
                </div>
                <div class="presenca-stat-label">Taxa de presença</div>
            </div>
        </div>

        <div class="presenca-lista">
            ${state.registros.map((r, i) => `
                <div class="presenca-linha ${r.presente ? 'presente' : ''}" data-idx="${i}">
                    <div class="avatar avatar-sm">${avatarHtml(r)}</div>
                    <span class="presenca-linha-nome">${esc(r.nome)}</span>
                    <div class="presenca-toggle">
                        <button class="presenca-btn presente ${r.presente ? 'active' : ''}"
                                data-acao="presente" data-idx="${i}">Presente</button>
                        <button class="presenca-btn ausente ${!r.presente ? 'active' : ''}"
                                data-acao="ausente" data-idx="${i}">Ausente</button>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="presenca-actions">
            <div class="presenca-actions-info">
                <strong id="resumo-acoes">${presentes}</strong> de
                <strong>${total}</strong> marcados como presentes.
            </div>
            <button class="btn-ghost" id="btn-limpar">Limpar</button>
            <button class="btn-solid" id="btn-salvar">Salvar presença</button>
        </div>
    `;

    /* Listeners */
    content.querySelectorAll('.presenca-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.idx);
            const valor = btn.dataset.acao === 'presente';
            state.registros[idx].presente = valor;
            atualizarLinha(idx);
        });
    });

    document.getElementById('btn-limpar')?.addEventListener('click', () => {
        state.registros.forEach(r => r.presente = false);
        renderPresenca();
    });

    document.getElementById('btn-salvar')?.addEventListener('click', salvarPresenca);
}

function atualizarLinha(idx) {
    const linha = content.querySelector(`.presenca-linha[data-idx="${idx}"]`);
    if (!linha) return;
    const r = state.registros[idx];

    linha.classList.toggle('presente', r.presente);
    linha.classList.toggle('ausente', !r.presente);

    linha.querySelector('.presenca-btn.presente')?.classList.toggle('active', r.presente);
    linha.querySelector('.presenca-btn.ausente')?.classList.toggle('active', !r.presente);

    /* Atualiza stats */
    const total = state.registros.length;
    const presentes = state.registros.filter(x => x.presente).length;
    const ausentes = total - presentes;

    document.getElementById('stat-presentes').textContent = presentes;
    document.getElementById('stat-ausentes').textContent = ausentes;
    document.getElementById('stat-taxa').textContent =
        total ? Math.round((presentes / total) * 100) + '%' : '0%';
    document.getElementById('resumo-acoes').textContent = presentes;
}

async function salvarPresenca() {
    if (!state.eventoId) return;

    const btn = document.getElementById('btn-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    const payload = {
        registros: state.registros.map(r => ({
            usuarioId: r.usuarioId,
            presente: r.presente
        }))
    };

    try {
        await api.post(`/presenca/evento/${state.eventoId}`, payload);
        toast.success('Presença salva', `${payload.registros.filter(r => r.presente).length} presentes registrados.`);
    } catch (err) {
        toast.error('Erro ao salvar', err?.message || 'Tente novamente.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar presença';
    }
}

/* ── Seletor de evento ── */
seletorEvento?.addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-title">Selecione um evento</div>
                <p class="empty-state-sub">Escolha um evento no seletor acima para registrar presença.</p>
            </div>`;
        return;
    }
    carregarPresenca(id);
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', carregarEventos);
if (document.readyState !== 'loading') carregarEventos();
