/* ============================================================
   LES — View Feed interno
   ============================================================ */

import { api } from '../core/api.js';
import Auth from '../core/auth.js';
import toast from '../core/toast.js';
import { initAppShell } from '../components/app-shell.js';
import { renderEmptyState } from '../components/table.js';

if (!initAppShell({ title: 'Feed' })) {
    throw new Error('Sem sessão');
}

const composerAvatar = document.getElementById('composer-avatar');
const composerText   = document.getElementById('composer-text');
const btnPublicar    = document.getElementById('btn-publicar');
const postsEl        = document.getElementById('feed-posts');
const maisEl         = document.getElementById('feed-mais');
const aniversariantesEl = document.getElementById('feed-aniversariantes');

const state = {
    posts: [],
    page: 0,
    totalPages: 1,
    size: 10
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
    if (p?.fotoUrl) return `<img src="${p.fotoUrl}" alt="${esc(p.nome)}">`;
    return esc(initials(p?.nome));
}

function tempoRelativo(iso) {
    if (!iso) return '';
    const agora = Date.now();
    const quando = new Date(iso).getTime();
    const diffSeg = Math.floor((agora - quando) / 1000);

    if (diffSeg < 60) return 'agora';
    if (diffSeg < 3600) return `${Math.floor(diffSeg / 60)}min`;
    if (diffSeg < 86400) return `${Math.floor(diffSeg / 3600)}h`;
    if (diffSeg < 604800) return `${Math.floor(diffSeg / 86400)}d`;

    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short'
    });
}

/* ── Avatar do composer ── */
composerAvatar.innerHTML = avatarHtml(Auth.user);

/* ── Carregar posts ── */
async function carregarPosts(append = false) {
    if (!append) postsEl.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api.get('/feed', {
            query: { page: state.page, size: state.size }
        });

        const novos = data?.content || data || [];
        state.totalPages = data?.totalPages || 1;

        if (append) {
            state.posts = [...state.posts, ...novos];
        } else {
            state.posts = novos;
        }

        renderPosts();
        renderBotaoMais();
    } catch (err) {
        if (!append) {
            renderEmptyState(postsEl, 'Erro ao carregar',
                err?.message || 'Não foi possível carregar o feed.');
        }
    }
}

function renderPosts() {
    if (!state.posts.length) {
        renderEmptyState(postsEl, 'Feed vazio',
            'Ninguém publicou ainda. Seja o primeiro!');
        return;
    }

    postsEl.innerHTML = state.posts.map(p => renderPost(p)).join('');

    /* Listeners */
    postsEl.querySelectorAll('[data-acao="curtir"]').forEach(btn => {
        btn.addEventListener('click', () => toggleCurtir(btn.dataset.id));
    });
    postsEl.querySelectorAll('[data-acao="excluir"]').forEach(btn => {
        btn.addEventListener('click', () => excluirPost(btn.dataset.id));
    });
    postsEl.querySelectorAll('[data-acao="comentar"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const form = postsEl.querySelector(`.feed-post[data-id="${btn.dataset.id}"] .feed-comentario-form`);
            form?.querySelector('input')?.focus();
        });
    });
    postsEl.querySelectorAll('.feed-comentario-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarComentario(form.dataset.postId, form.querySelector('input').value);
        });
    });
}

function renderPost(p) {
    const autor = p.autor || {};
    const curtidas = p.curtidas ?? 0;
    const curtido = p.curtidoPeloUsuario === true;
    const comentarios = p.comentarios || [];
    const podeExcluir = autor.id === Auth.user?.id ||
        Auth.hasAnyPerm('FEED_MODERAR');

    const comentariosHtml = comentarios.map(c => `
        <div class="feed-comentario">
            <div class="avatar avatar-sm">${avatarHtml(c.autor)}</div>
            <div class="feed-comentario-body">
                <div class="feed-comentario-autor">${esc(c.autor?.nome || '—')}</div>
                <div class="feed-comentario-texto">${esc(c.texto)}</div>
            </div>
        </div>
    `).join('');

    return `
        <div class="feed-post" data-id="${p.id}">
            <div class="feed-post-head">
                <div class="avatar">${avatarHtml(autor)}</div>
                <div class="feed-post-info">
                    <div class="feed-post-autor">${esc(autor.nome || '—')}</div>
                    <div class="feed-post-cargo">${esc(autor.cargoPrincipal || 'Membro')}</div>
                </div>
                <span class="feed-post-hora">${tempoRelativo(p.criadoEm)}</span>
            </div>

            <div class="feed-post-body">${esc(p.conteudo)}</div>

            <div class="feed-post-actions">
                <button class="feed-action ${curtido ? 'curtido' : ''}"
                        data-acao="curtir" data-id="${p.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24"
                         fill="${curtido ? 'currentColor' : 'none'}"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    ${curtidas}
                </button>
                <button class="feed-action" data-acao="comentar" data-id="${p.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    ${comentarios.length}
                </button>
                ${podeExcluir ? `
                    <button class="feed-action" data-acao="excluir" data-id="${p.id}"
                            style="margin-left:auto;color:#ff7088">
                        Excluir
                    </button>` : ''}
            </div>

            ${comentarios.length || true ? `
                <div class="feed-post-comentarios">
                    ${comentariosHtml}
                    <form class="feed-comentario-form" data-post-id="${p.id}">
                        <input type="text" placeholder="Escreva um comentário..." required>
                        <button class="btn-ghost" type="submit" style="padding:.5rem .85rem;font-size:.7rem">
                            Enviar
                        </button>
                    </form>
                </div>` : ''}
        </div>
    `;
}

/* ── Botão "mais" ── */
function renderBotaoMais() {
    if (state.page >= state.totalPages - 1) {
        maisEl.innerHTML = '';
        return;
    }

    maisEl.innerHTML = `<button class="btn-ghost" id="btn-mais">Carregar mais</button>`;
    document.getElementById('btn-mais')?.addEventListener('click', () => {
        state.page++;
        carregarPosts(true);
    });
}

/* ── Publicar ── */
btnPublicar?.addEventListener('click', async () => {
    const conteudo = composerText.value.trim();
    if (!conteudo) {
        toast.error('Vazio', 'Escreva algo antes de publicar.');
        return;
    }

    btnPublicar.disabled = true;
    btnPublicar.textContent = 'Publicando…';

    try {
        await api.post('/feed', { conteudo });
        composerText.value = '';
        state.page = 0;
        toast.success('Publicado', 'Sua mensagem está no ar.');
        carregarPosts();
    } catch (err) {
        toast.error('Erro ao publicar', err?.message || 'Tente novamente.');
    } finally {
        btnPublicar.disabled = false;
        btnPublicar.textContent = 'Publicar';
    }
});

/* ── Curtir ── */
async function toggleCurtir(id) {
    const post = state.posts.find(p => String(p.id) === String(id));
    if (!post) return;

    const eraCurtido = post.curtidoPeloUsuario;
    post.curtidoPeloUsuario = !eraCurtido;
    post.curtidas = (post.curtidas ?? 0) + (eraCurtido ? -1 : 1);

    /* Atualiza visual imediatamente */
    const postEl = postsEl.querySelector(`.feed-post[data-id="${id}"]`);
    const btn = postEl?.querySelector('[data-acao="curtir"]');
    if (btn) {
        btn.classList.toggle('curtido', post.curtidoPeloUsuario);
        btn.querySelector('svg').setAttribute('fill', post.curtidoPeloUsuario ? 'currentColor' : 'none');
        btn.lastChild.textContent = ` ${post.curtidas}`;
    }

    try {
        const metodo = eraCurtido ? 'delete' : 'post';
        await api[metodo](`/feed/${id}/curtir`, {});
    } catch {
        /* Reverte em caso de erro */
        post.curtidoPeloUsuario = eraCurtido;
        post.curtidas = (post.curtidas ?? 0) + (eraCurtido ? 1 : -1);
        carregarPosts();
    }
}

/* ── Comentar ── */
async function enviarComentario(postId, texto) {
    texto = texto.trim();
    if (!texto) return;

    try {
        await api.post(`/feed/${postId}/comentarios`, { conteudo: texto });
        toast.success('Comentado', '');
        state.page = 0;
        carregarPosts();
    } catch (err) {
        toast.error('Erro ao comentar', err?.message || 'Tente novamente.');
    }
}

/* ── Excluir ── */
async function excluirPost(id) {
    if (!confirm('Excluir esta publicação?')) return;

    try {
        await api.delete(`/feed/${id}`);
        toast.success('Excluído', '');
        state.posts = state.posts.filter(p => String(p.id) !== String(id));
        renderPosts();
    } catch (err) {
        toast.error('Erro ao excluir', err?.message || 'Tente novamente.');
    }
}

/* ── Aniversariantes ── */
async function carregarAniversariantes() {
    try {
        const data = await api.get('/membros/aniversariantes');
        const lista = Array.isArray(data) ? data : [];

        if (!lista.length) {
            aniversariantesEl.innerHTML =
                '<p style="font-size:.82rem;color:var(--gray-lt)">Nenhum este mês.</p>';
            return;
        }

        aniversariantesEl.innerHTML = lista.map(m => `
            <div class="feed-sidebar-item">
                <div class="avatar avatar-sm">${avatarHtml(m)}</div>
                <div class="feed-sidebar-item-info">
                    <div class="feed-sidebar-item-nome">${esc(m.nome)}</div>
                    <div class="feed-sidebar-item-meta">Dia ${m.dia}</div>
                </div>
            </div>
        `).join('');
    } catch {
        aniversariantesEl.innerHTML =
            '<p style="font-size:.82rem;color:var(--gray-lt)">—</p>';
    }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    carregarPosts();
    carregarAniversariantes();
});
if (document.readyState !== 'loading') {
    carregarPosts();
    carregarAniversariantes();
}
