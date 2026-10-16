/* ============================================================
   LES — View Eventos
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import Modal from '../components/modal.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Eventos' })) {
    throw new Error('Sem sessão');
}

const container  = document.getElementById('eventos-container');
const inputBusca = document.getElementById('filtro-busca');
const selTipo    = document.getElementById('filtro-tipo');
const selStatus  = document.getElementById('filtro-status');
const btnNovo    = document.getElementById('btn-novo-evento');

const state = {
    eventos: [],
    filtros: { busca: '', tipo: '', status: '' }
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

const TIPO_LABELS = {
    WORKSHOP: { label: 'Workshop', badge: 'badge-green' },
    CURSO:    { label: 'Curso',    badge: 'badge-blue' },
    BOOTCAMP: { label: 'Bootcamp', badge: 'badge-gold' },
    PALESTRA: { label: 'Palestra', badge: 'badge-gray' }
};

const STATUS_LABELS = {
    AGENDADO:   { label: 'Agendado',   badge: 'badge-green' },
    FINALIZADO: { label: 'Finalizado', badge: 'badge-gray' },
    CANCELADO:  { label: 'Cancelado',  badge: 'badge-red' }
};

function tipoBadge(tipo) {
    const info = TIPO_LABELS[tipo] || { label: tipo || '—', badge: 'badge-gray' };
    return `<span class="badge ${info.badge}">${esc(info.label)}</span>`;
}

function statusBadge(status) {
    const info = STATUS_LABELS[status] || { label: status || '—', badge: 'badge-gray' };
    return `<span class="badge ${info.badge}">${esc(info.label)}</span>`;
}

function fmtData(iso) {
    if (!iso) return { dia: '--', mes: '---' };
    try {
        const d = new Date(iso);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
        return { dia, mes };
    } catch { return { dia: '--', mes: '---' }; }
}

function fmtDataCompleta(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch { return iso; }
}

/* ── Carregar ── */
async function carregarEventos() {
    container.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await api.get('/eventos', {
            query: {
                busca: state.filtros.busca || undefined,
                tipo: state.filtros.tipo || undefined,
                status: state.filtros.status || undefined
            }
        });
        state.eventos = data?.content || data || [];
        renderEventos();
    } catch (err) {
        renderEmptyState(container, 'Erro ao carregar',
            err?.message || 'Não foi possível buscar os eventos.');
    }
}

function renderEventos() {
    if (!state.eventos.length) {
        renderEmptyState(container, 'Nenhum evento',
            'Nenhum resultado para os filtros aplicados.');
        return;
    }

    container.className = 'eventos-grid';
    container.innerHTML = state.eventos.map(e => {
        const data = fmtData(e.dataInicio);
        const vagas = e.vagas ?? 0;
        const inscritos = e.inscritos ?? 0;

        return `
            <div class="evento-card" data-id="${e.id}">
                <div class="evento-card-cover">
                    <div class="evento-card-data">
                        <div class="evento-card-data-dia">${data.dia}</div>
                        <div class="evento-card-data-mes">${data.mes}</div>
                    </div>
                    <span class="evento-card-tipo">${tipoBadge(e.tipo)}</span>
                </div>
                <div class="evento-card-body">
                    <h3 class="evento-card-titulo">${esc(e.titulo)}</h3>
                    <div class="evento-card-meta">
                        <div class="evento-card-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2"
                                 stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${fmtDataCompleta(e.dataInicio)}
                        </div>
                        ${e.local ? `
                            <div class="evento-card-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="2"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                ${esc(e.local)}
                            </div>` : ''}
                    </div>
                    <div class="evento-card-footer">
                        <div class="evento-card-vagas">
                            <strong>${inscritos}</strong>/${vagas} vagas
                        </div>
                        ${statusBadge(e.status)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.evento-card').forEach(card => {
        card.addEventListener('click', () => abrirDetalheEvento(card.dataset.id));
    });
}

/* ── Detalhe ── */
async function abrirDetalheEvento(id) {
    Modal.open({
        title: 'Detalhes do evento',
        size: 'xl',
        content: '<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>'
    });

    try {
        const e = await api.get(`/eventos/${id}`);
        Modal.setContent(renderDetalheHtml(e));
    } catch (err) {
        Modal.setContent(`<p style="color:#ff7088">${esc(err?.message || 'Erro')}</p>`);
    }
}

function renderDetalheHtml(e) {
    const palestrantes = (e.palestrantes || []).map(p => `
        <div class="palestrante-card">
            <div class="palestrante-avatar">
                ${p.fotoUrl
                    ? `<img src="${p.fotoUrl}" alt="${esc(p.nome)}">`
                    : esc(initials(p.nome))}
            </div>
            <div class="palestrante-nome">${esc(p.nome)}</div>
            ${p.bio ? `<div class="palestrante-bio">${esc(p.bio)}</div>` : ''}
        </div>
    `).join('');

    return `
        <div class="evento-detalhe-head">
            <h2 class="evento-detalhe-titulo">${esc(e.titulo)}</h2>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                ${tipoBadge(e.tipo)}
                ${statusBadge(e.status)}
            </div>
        </div>

        <div class="evento-detalhe-meta">
            <div class="evento-detalhe-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${fmtDataCompleta(e.dataInicio)}${e.dataFim ? ` — ${fmtDataCompleta(e.dataFim)}` : ''}
            </div>
            ${e.local ? `
                <div class="evento-detalhe-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${esc(e.local)}
                </div>` : ''}
            <div class="evento-detalhe-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z"/>
                </svg>
                ${e.inscritos ?? 0} / ${e.vagas ?? 0} vagas
            </div>
        </div>

        ${e.descricao ? `
            <div class="evento-detalhe-section">
                <div class="evento-detalhe-section-title">Sobre o evento</div>
                <p class="evento-detalhe-desc">${esc(e.descricao)}</p>
            </div>` : ''}

        ${palestrantes ? `
            <div class="evento-detalhe-section">
                <div class="evento-detalhe-section-title">Palestrantes</div>
                <div class="palestrantes-grid">${palestrantes}</div>
            </div>` : ''}
    `;
}

/* ── Novo evento ── */
btnNovo?.addEventListener('click', () => {
    Modal.open({
        title: 'Novo evento',
        size: 'lg',
        content: `
            <form id="form-evento">
                <div class="form-field">
                    <label for="ev-titulo">Título</label>
                    <input type="text" id="ev-titulo" required placeholder="Ex: Workshop de Git">
                </div>
                <div class="form-row-2">
                    <div class="form-field">
                        <label for="ev-tipo">Tipo</label>
                        <select id="ev-tipo">
                            <option value="WORKSHOP">Workshop</option>
                            <option value="CURSO">Curso</option>
                            <option value="BOOTCAMP">Bootcamp</option>
                            <option value="PALESTRA">Palestra</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="ev-vagas">Vagas</label>
                        <input type="number" id="ev-vagas" min="1" value="30">
                    </div>
                </div>
                <div class="form-row-2">
                    <div class="form-field">
                        <label for="ev-inicio">Início</label>
                        <input type="datetime-local" id="ev-inicio" required>
                    </div>
                    <div class="form-field">
                        <label for="ev-fim">Fim</label>
                        <input type="datetime-local" id="ev-fim">
                    </div>
                </div>
                <div class="form-field">
                    <label for="ev-local">Local</label>
                    <input type="text" id="ev-local" placeholder="Ex: Auditório IFPE Campus Recife">
                </div>
                <div class="form-field">
                    <label for="ev-desc">Descrição</label>
                    <textarea id="ev-desc" rows="3" placeholder="Sobre o evento..."></textarea>
                </div>
            </form>
        `,
        footer: `
            <button class="btn-ghost" data-acao="cancelar">Cancelar</button>
            <button class="btn-solid" data-acao="criar">Criar evento</button>
        `
    });

    const body = Modal.getBody();
    const footer = body?.parentElement?.querySelector('.les-modal-footer');

    footer?.querySelector('[data-acao="cancelar"]')
        ?.addEventListener('click', () => Modal.close());

    footer?.querySelector('[data-acao="criar"]')
        ?.addEventListener('click', async () => {
            const form = document.getElementById('form-evento');
            const titulo = form.querySelector('#ev-titulo').value.trim();
            const inicio = form.querySelector('#ev-inicio').value;

            if (!titulo || !inicio) {
                toast.error('Campos obrigatórios', 'Preencha título e data de início.');
                return;
            }

            const payload = {
                titulo,
                tipo: form.querySelector('#ev-tipo').value,
                vagas: parseInt(form.querySelector('#ev-vagas').value, 10) || 0,
                dataInicio: new Date(inicio).toISOString(),
                dataFim: form.querySelector('#ev-fim').value
                    ? new Date(form.querySelector('#ev-fim').value).toISOString()
                    : null,
                local: form.querySelector('#ev-local').value.trim(),
                descricao: form.querySelector('#ev-desc').value.trim(),
                status: 'AGENDADO'
            };

            try {
                await api.post('/eventos', payload);
                toast.success('Evento criado', titulo);
                Modal.close();
                carregarEventos();
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
        carregarEventos();
    }, 400);
});

selTipo?.addEventListener('change', (e) => {
    state.filtros.tipo = e.target.value;
    carregarEventos();
});

selStatus?.addEventListener('change', (e) => {
    state.filtros.status = e.target.value;
    carregarEventos();
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', carregarEventos);
if (document.readyState !== 'loading') carregarEventos();
