/* ============================================================
   LES — View Dashboard
   ============================================================ */

import { api } from '../core/api.js';
import toast from '../core/toast.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Dashboard' })) {
    throw new Error('Sem sessão');
}

const kpiMembros  = document.getElementById('kpi-membros');
const kpiProjetos = document.getElementById('kpi-projetos');
const kpiEventos  = document.getElementById('kpi-eventos');
const kpiHoras    = document.getElementById('kpi-horas');
const dashEventos   = document.getElementById('dash-eventos');
const dashAtividade = document.getElementById('dash-atividade');
const dashFeed      = document.getElementById('dash-feed');
const btnRefresh    = document.getElementById('btn-refresh');

function setKpi(el, value, unit = '') {
    if (!el) return;
    el.textContent = unit ? `${value} ${unit}` : value;
}

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function fmtDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short'
        });
    } catch { return iso; }
}

async function carregarKPIs() {
    try {
        const data = await api.get('/dashboard/resumo');
        setKpi(kpiMembros,  data.totalMembros  ?? 0);
        setKpi(kpiProjetos, data.totalProjetos ?? 0);
        setKpi(kpiEventos,  data.eventosMes    ?? 0);
        setKpi(kpiHoras,    data.horasMes      ?? 0, 'h');
    } catch (err) {
        [kpiMembros, kpiProjetos, kpiEventos, kpiHoras].forEach(el => {
            if (el) el.textContent = '—';
        });
        console.warn('[Dashboard] KPIs falharam:', err.message);
    }
}

async function carregarProximosEventos() {
    if (!dashEventos) return;
    try {
        const data = await api.get('/eventos', { query: { status: 'AGENDADO', size: 3 } });
        const list = data?.content || data || [];
        if (!list.length) {
            renderEmptyState(dashEventos, 'Sem eventos', 'Nada agendado para os próximos dias.');
            return;
        }
        dashEventos.innerHTML = list.map(ev => `
            <div style="display:flex;gap:.75rem;padding:.85rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div class="avatar" style="width:44px;height:44px;font-size:.7rem">
                    ${fmtDate(ev.dataInicio)}
                </div>
                <div style="flex:1;min-width:0">
                    <strong style="color:var(--white);display:block;font-size:.9rem">${esc(ev.titulo)}</strong>
                    <span style="color:var(--gray-lt);font-size:.78rem">${esc(ev.tipo || 'Evento')}</span>
                </div>
            </div>`).join('');
    } catch (err) {
        renderEmptyState(dashEventos, 'Não foi possível carregar', 'Tente novamente.');
    }
}

async function carregarAtividade() {
    if (!dashAtividade) return;
    try {
        const data = await api.get('/dashboard/atividade', { query: { periodo: '7d' } });
        const items = Array.isArray(data) ? data : [];
        if (!items.length) {
            renderEmptyState(dashAtividade, 'Sem atividade', 'Nenhuma movimentação nos últimos 7 dias.');
            return;
        }
        dashAtividade.innerHTML = items.map(it => `
            <div style="display:flex;gap:.75rem;padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <span style="color:var(--neon-green);font-size:1.1rem">●</span>
                <div style="flex:1;min-width:0">
                    <span style="color:var(--white);font-size:.88rem;display:block">${esc(it.descricao || it.titulo)}</span>
                    <span style="color:var(--gray-lt);font-size:.75rem">${fmtDate(it.data)}</span>
                </div>
            </div>`).join('');
    } catch (err) {
        renderEmptyState(dashAtividade, 'Sem dados', 'Ainda não há atividade.');
    }
}

async function carregarFeed() {
    if (!dashFeed) return;
    try {
        const data = await api.get('/feed', { query: { size: 3 } });
        const posts = data?.content || data || [];
        if (!posts.length) {
            renderEmptyState(dashFeed, 'Feed vazio', 'Ninguém publicou ainda.');
            return;
        }
        dashFeed.innerHTML = posts.map(p => `
            <div style="padding:.85rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div style="display:flex;gap:.6rem;align-items:center;margin-bottom:.35rem">
                    <div class="avatar avatar-sm">
                        ${p.autor?.fotoUrl
                            ? `<img src="${p.autor.fotoUrl}" alt="${esc(p.autor.nome)}">`
                            : esc((p.autor?.nome || '?').charAt(0))}
                    </div>
                    <strong style="color:var(--white);font-size:.85rem">${esc(p.autor?.nome || 'Usuário')}</strong>
                    <span style="color:var(--gray-lt);font-size:.72rem;margin-left:auto">${fmtDate(p.criadoEm)}</span>
                </div>
                <p style="color:rgba(245,245,240,.7);font-size:.85rem;line-height:1.55">
                    ${esc((p.conteudo || '').slice(0, 140))}${p.conteudo?.length > 140 ? '…' : ''}
                </p>
            </div>`).join('');
    } catch (err) {
        renderEmptyState(dashFeed, 'Sem feed', 'Não foi possível carregar o feed.');
    }
}

async function carregarTudo() {
    await Promise.allSettled([
        carregarKPIs(),
        carregarProximosEventos(),
        carregarAtividade(),
        carregarFeed()
    ]);
}

btnRefresh?.addEventListener('click', async () => {
    btnRefresh.disabled = true;
    btnRefresh.textContent = 'Atualizando…';
    await carregarTudo();
    btnRefresh.disabled = false;
    btnRefresh.textContent = 'Atualizar';
    toast.success('Atualizado', 'Dados recarregados.');
});

const params = new URLSearchParams(location.search);
if (params.get('forbidden') === '1') {
    toast.error('Acesso negado', 'Você não tem permissão para essa área.');
    history.replaceState(null, '', location.pathname);
}

document.addEventListener('DOMContentLoaded', carregarTudo);
if (document.readyState !== 'loading') carregarTudo();
