/* ============================================================
   LES — View de Login
   ============================================================ */

import Auth from '../core/auth.js';
import { ApiError } from '../core/api.js';
import toast from '../core/toast.js';
import { requireGuest } from '../core/guards.js';

const nextUrl = new URLSearchParams(location.search).get('next');
requireGuest(nextUrl || window.LES_CONFIG.DEFAULT_ROUTE);

const form        = document.getElementById('login-form');
const inputEmail  = document.getElementById('email');
const inputSenha  = document.getElementById('senha');
const toggleSenha = document.getElementById('toggle-senha');
const btnSubmit   = document.getElementById('btn-submit');
const alertBox    = document.getElementById('login-alert');

const modalEsqueci  = document.getElementById('modal-esqueci');
const linkEsqueci   = document.getElementById('link-esqueci');
const formEsqueci   = document.getElementById('form-esqueci');
const inputEmailEsq = document.getElementById('email-esqueci');

function showAlert(type, message) {
    alertBox.innerHTML = message
        ? `<div class="auth-alert ${type}">${message}</div>`
        : '';
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    const err = field.querySelector('.form-error');
    if (err) err.textContent = message || '';
}

function clearErrors() {
    ['field-email', 'field-senha'].forEach(id => setFieldError(id, ''));
    showAlert('error', '');
}

function setLoading(on) {
    btnSubmit.disabled = on;
    btnSubmit.classList.toggle('loading', on);
    const label = btnSubmit.querySelector('span');
    if (label) label.textContent = on ? 'Entrando…' : 'Entrar';
}

function validate() {
    let ok = true;
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    if (!email) {
        setFieldError('field-email', 'Informe o e-mail.');
        ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('field-email', 'E-mail inválido.');
        ok = false;
    }

    if (!senha) {
        setFieldError('field-senha', 'Informe a senha.');
        ok = false;
    } else if (senha.length < 6) {
        setFieldError('field-senha', 'A senha deve ter ao menos 6 caracteres.');
        ok = false;
    }
    return ok;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    setLoading(true);
    try {
        const user = await Auth.login(inputEmail.value.trim(), inputSenha.value);
        toast.success('Bem-vindo!', user.nome || 'Login efetuado');

        if (user.primeiroAcesso) {
            const target = nextUrl || '/app/perfil.html?first=1';
            setTimeout(() => { window.location.href = target; }, 350);
            return;
        }
        const target = nextUrl || window.LES_CONFIG.DEFAULT_ROUTE;
        setTimeout(() => { window.location.href = target; }, 350);
    } catch (err) {
        setLoading(false);
        if (err instanceof ApiError) {
            if (err.status === 401) {
                showAlert('error', 'E-mail ou senha incorretos.');
                setFieldError('field-email', ' ');
                setFieldError('field-senha', ' ');
            } else if (err.status === 403) {
                showAlert('error', 'Sua conta está inativa. Procure a diretoria.');
            } else if (err.status === 429) {
                showAlert('error', 'Muitas tentativas. Aguarde alguns minutos.');
            } else if (err.status === 0) {
                showAlert('error', 'Sem conexão com o servidor. Tente novamente.');
            } else {
                showAlert('error', err.message || 'Erro inesperado.');
            }
        } else {
            showAlert('error', 'Erro inesperado. Tente novamente.');
            console.error(err);
        }
    }
});

toggleSenha?.addEventListener('click', () => {
    const isPwd = inputSenha.type === 'password';
    inputSenha.type = isPwd ? 'text' : 'password';
    toggleSenha.textContent = isPwd ? '🙈' : '👁';
    toggleSenha.setAttribute('aria-label', isPwd ? 'Ocultar senha' : 'Mostrar senha');
    inputSenha.focus();
});

function openModalEsqueci() {
    modalEsqueci.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputEmailEsq.focus(), 100);
}

function closeModalEsqueci() {
    modalEsqueci.classList.remove('open');
    document.body.style.overflow = '';
    formEsqueci.reset();
}

linkEsqueci?.addEventListener('click', (e) => {
    e.preventDefault();
    openModalEsqueci();
});

modalEsqueci?.querySelector('.les-modal-close')
    ?.addEventListener('click', closeModalEsqueci);

modalEsqueci?.addEventListener('click', (e) => {
    if (e.target === modalEsqueci) closeModalEsqueci();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEsqueci.classList.contains('open')) {
        closeModalEsqueci();
    }
});

formEsqueci?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmailEsq.value.trim();
    if (!email) return;

    const btn = formEsqueci.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span><span style="margin-left:.5rem">Enviando…</span>';

    try {
        await Auth.esqueciSenha(email);
        toast.success('Verifique seu e-mail', 'Se o endereço existir, enviaremos o link.');
        closeModalEsqueci();
    } catch (err) {
        toast.error('Não foi possível enviar', err?.message || 'Tente novamente.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Enviar link</span>';
    }
});

const params = new URLSearchParams(location.search);
if (params.get('expired') === '1') {
    showAlert('error', 'Sua sessão expirou. Faça login novamente.');
}
