/* ============================================================
   LES – LIGA DE ENGENHARIA DE SOFTWARE | IFPE Recife
   scriptpage.js — Lógica interativa da página

   ÍNDICE:
     §1  HAMBURGER MENU
     §2  HERO SLIDESHOW
     §3  CARROSSEL DE PROJETOS
     §4  DADOS DOS MEMBROS (membersData)
     §5  MODAL DE PERFIL INDIVIDUAL (#member-modal)
     §6  MODAL DE VISÃO GERAL DA EQUIPE (#team-overview-modal)
     §7  MODAL DE EVENTOS
     §8  CONTAGEM REGRESSIVA DO INGRESSO + MODAL DE ETAPAS
   ============================================================ */


/* ════════════════════════════════════════════════════════════
   §1  HAMBURGER MENU
════════════════════════════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileNav.setAttribute('aria-hidden', !isOpen);
});

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
    });
});


/* ════════════════════════════════════════════════════════════
   §2  HERO SLIDESHOW
   Para adicionar slides: inclua objetos em heroImages.
   Formato: { src: 'caminho.jpg', alt: 'Descrição' }
════════════════════════════════════════════════════════════ */
const heroImages = [
    { src: 'assets/imagens/capa/CAPA1.jpg', alt: 'IFPE Campus Recife — Fachada' },
    { src: 'assets/imagens/capa/CAPA2.jpeg', alt: 'Workshop LES' },
    { src: 'assets/imagens/capa/CAPA3.jpeg', alt: 'Workshop LES' },
];

const slideshowEl = document.getElementById('heroSlideshow');
const slideDotsEl = document.getElementById('slideDots');
let currentSlide = 0;
let slideTimer = null;

heroImages.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    slideshowEl.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    slideDotsEl.appendChild(dot);
});

function goToSlide(index) {
    const slides = slideshowEl.querySelectorAll('.hero-slide');
    const dots = slideDotsEl.querySelectorAll('.slide-dot');
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (index + heroImages.length) % heroImages.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    clearInterval(slideTimer);
    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);


/* ════════════════════════════════════════════════════════════
   §3  CARROSSEL DE PROJETOS
   Drag + Touch com fallback para scroll vertical da página.
════════════════════════════════════════════════════════════ */
const track = document.getElementById('projectsTrack');
const dotsWrap = document.getElementById('carouselDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;
let initialScrollY = 0;
let cardWidth = 0;

function getCardWidth() {
    const card = track.querySelector('.project-card');
    return card ? card.getBoundingClientRect().width + 24 : 320;
}

function updateCarousel(smooth = true) {
    cardWidth = getCardWidth();
    track.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
    track.style.transform = `translateX(${-currentIndex * cardWidth}px)`;
    updateDotsAndButtons();
}

function updateDotsAndButtons() {
    dotsWrap.querySelectorAll('.carousel-dot').forEach((dot, i) =>
        dot.classList.toggle('active', i === currentIndex));
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= track.children.length - 1;
}

function onTouchStart(e) {
    if (e.touches.length > 1) return;
    isDragging = true; startX = e.touches[0].clientX;
    currentX = startX; initialScrollY = window.scrollY;
    track.style.transition = 'none';
}

function onTouchMove(e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    if (Math.abs(window.scrollY - initialScrollY) > 15) { isDragging = false; return; }
    track.style.transform = `translateX(${-currentIndex * cardWidth + (currentX - startX)}px)`;
}

function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    const movedBy = currentX - startX;
    const threshold = cardWidth * 0.25;
    track.style.transition = 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)';
    if (movedBy < -threshold && currentIndex < track.children.length - 1) currentIndex++;
    else if (movedBy > threshold && currentIndex > 0) currentIndex--;
    updateCarousel();
}

track.addEventListener('touchstart', onTouchStart, { passive: true });
track.addEventListener('touchmove', onTouchMove, { passive: false });
track.addEventListener('touchend', onTouchEnd);
prevBtn.addEventListener('click', () => { currentIndex--; updateCarousel(); });
nextBtn.addEventListener('click', () => { currentIndex++; updateCarousel(); });

function createDots() {
    dotsWrap.innerHTML = '';
    Array.from(track.children).forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => { currentIndex = i; updateCarousel(); });
        dotsWrap.appendChild(dot);
    });
}

window.addEventListener('resize', () => updateCarousel());
createDots();
updateCarousel();


/* ════════════════════════════════════════════════════════════
   §4  DADOS DOS MEMBROS
   ────────────────────────────────────────────────────────────
   COMO ADICIONAR UM MEMBRO:
     1. Copie um bloco e preencha as chaves (name, role, etc.)
     2. No HTML (index.html > .equipe-data-source), adicione:
        <div class="member-card" data-member="CHAVE" data-group="GRUPO"></div>
     3. Atualize o contador em equipe-member-count se necessário

   GRUPOS:
     "diretoria"    → Coordenação e Diretoria
     "dev"          → Membros Desenvolvedores
     "colaborador"  → Colaboradores
     "externo"      → Colaboradores Externos
     "ex_integrante"→ Ex Integrantes

   PARA NOVA CATEGORIA:
     1. Adicione a entrada em GROUP_LABELS (§6)
     2. Adicione dados aqui
     3. Adicione card em .equipe-data-source no HTML
     4. Adicione pílula .equipe-tag no HTML (opcional)
════════════════════════════════════════════════════════════ */
const membersData = {

    /* ── Coordenação ── */
    hilson: {
        name: 'Prof. Hilson Andrade',
        role: 'Colaborador — Diretor de Extensão IFPE-Recife',
        initials: 'HI',
        group: 'colaborador',
        bio: 'Professor e pesquisador do IFPE Campus Recife que, há mais de vinte anos, utiliza a ciência e a tecnologia para resolver problemas. Doutorando em Engenharia da Computação, Mestre em Ciências da Computação, Engenheiro Eletrônico e técnico em Eletrotécnica, coordena a Liga de Engenharia de Software, promovendo a formação prática e o desenvolvimento de soluções tecnológicas com impacto real na comunidade.',
        links: {
            linkedin: 'https://www.linkedin.com/in/hilson-andrade-36719344/',
            email: 'hilsonvilar@recife.ifpe.edu.br',
        }
    },

    rafael: {
        name: 'Prof. Dr. Rafael Roque Aschoff',
        role: 'Coordenador do Projeto',
        initials: 'RA',
        group: 'diretoria',
        bio: 'Professor e pesquisador do IFPE Campus Recife. Coordena a Liga de Engenharia de Software, promovendo a formação prática e o desenvolvimento de soluções tecnológicas com impacto real na comunidade.',
        links: {
            github: 'https://github.com/roque86',
            email: 'mailto:rafael.aschoff@recife.ifpe.edu.br',
        }
    },

    /* ── Diretoria ── */
    ilian: {
        name: 'Ilian Solano Bezerra da Silva', role: 'Presidente e fundador',
        initials: 'IS', group: 'diretoria',
        bio: 'Presidente da LES-IFPE. Lidera a equipe com foco em inovação, gestão de pessoas e articulação institucional da liga.',
        links: { github: 'https://github.com/ilian-oss', linkedin: 'https://www.linkedin.com/in/ilian-solano/' }
    },

    yuri: {
        name: 'Yuri Santos de Oliveira', role: 'Vice-presidente e fundador',
        initials: 'YO', group: 'diretoria',
        bio: 'Vice-presidente da LES, responsável por apoiar a presidência na coordenação estratégica e operacional da liga.',
        links: { github: 'https://github.com/Yuriportf', linkedin: 'https://www.linkedin.com/in/yuri-oliveira-aqui/', instagram: 'https://www.instagram.com/_yurioliv_/', email: 'mailto:yuriprodeveloper@gmail.com' }
    },

    christoph: {
        name: 'Christoph Soares Diehl', role: 'Desenvolvedor fundador',
        initials: 'CD', group: 'dev',
        bio: 'Diretor de Projetos da LES. Gerencia o portfólio de projetos, garantindo alinhamento técnico e entrega de valor para a comunidade.',
        links: { github: 'https://github.com/christoph-sd', linkedin: 'https://linkedin.com/in/' }
    },

    alane: {
        name: 'Maria Alane Oliveira de Arruda Camara', role: 'Diretora de Desenvolvimento e fundadora',
        initials: 'MA', group: 'diretoria',
        bio: 'Diretora de Desenvolvimento da LES. Coordena as práticas técnicas, revisão de código e evolução das competências dos membros.',
        links: { github: 'https://github.com/AlaneOliveira', linkedin: 'https://linkedin.com/in/' }
    },


    /* ── Desenvolvedores ── */
    lucas: {
        name: 'Lucas Furtado de Matos', role: 'Desenvolvedor',
        initials: 'LF', group: 'dev',
        bio: 'Membro desenvolvedor da LES, atuando no desenvolvimento de projetos com impacto na comunidade acadêmica do IFPE.',
        links: { github: 'https://github.com/lfurtadomatos', linkedin: 'https://linkedin.com/in/' }
    },



    guilherme: {
        name: 'Guilherme Nascimento F. de Barros Moraes', role: 'Desenvolvedor',
        initials: 'GN', group: 'dev',
        bio: 'Membro desenvolvedor da LES, engajado no desenvolvimento de soluções tecnológicas e aprendizado contínuo.',
        links: { github: 'https://github.com/Guinfbm', linkedin: 'https://www.linkedin.com/in/guilherme-nascimento-f-b-moraes-1a70a8348/' }
    },

    paulo: {
        name: 'Paulo de Tarso Olímpio Gomes da Silva', role: 'Desenvolvedor',
        initials: 'PT', group: 'dev',
        bio: 'Membro desenvolvedor da LES, colaborando ativamente com os projetos e iniciativas técnicas da liga.',
        links: { github: 'https://github.com/Paulo-Novbr', linkedin: 'https://www.linkedin.com/in/paulo-ol%C3%ADmpio-a96156339/' }
    },

    bruno: {
        name: 'Bruno Luiz da Silva', role: 'Desenvolvedor',
        initials: 'BL', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico e entrega de valor nos projetos da liga.',
        links: { github: 'https://github.com/Bruno-0706', linkedin: 'https://www.linkedin.com/in/bruno-luiz-b86792339/' }
    },

    lyzia: {
        name: 'Lyzia Karollen Da Silva Gomes', role: 'Desenvolvedor',
        initials: 'PT', group: 'dev',
        bio: 'Membro desenvolvedor da LES, colaborando ativamente com os projetos e iniciativas técnicas da liga.',
        links: { github: 'https://github.com/LyziaGomes', linkedin: 'https://www.linkedin.com/in/lyzia-gomes-288548378' }
    },

    lyzia: {
        name: 'Lyzia Karollen Da Silva Gomes', role: 'Desenvolvedor',
        initials: 'PT', group: 'dev',
        bio: 'Membro desenvolvedor da LES, colaborando ativamente com os projetos e iniciativas técnicas da liga.',
        links: { github: 'https://github.com/LyziaGomes', linkedin: 'https://www.linkedin.com/in/lyzia-gomes-288548378' }
    },

    marcos: {
        name: 'Marcos Aurélio Lopes de Araújo',
        role: 'Desenvolvedor',
        initials: 'MA',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico e entrega de valor nos projetos da liga.',
        links: {
            github: 'https://github.com/marcosaureliodevelop', linkedin: 'https://www.linkedin.com/in/marcos-aurélio-4566a4237/',
        }
    },

    renan: {
        name: 'Renan Henrico Borges Pinto', role: 'Desenvolvedor',
        initials: 'RH', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico e entrega de valor nos projetos da liga.',
        links: { github: 'https://github.com/Renansoader', linkedin: 'https://www.linkedin.com/authwall?trk=bf&trkInfo=AQEUrJM-AzfzAAAAAZ3-wThopYEn__ENQuPhR6PUWJBYxwumZF0zSKlJ2MvFfZ9LuVehOw83Dr4VPWF2-U268s5MgeF8rSZCJpF9LxF3RC2STciOzsa2oPfK7elY3T8kjSvWEwI=&original_referer=&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fin%2Frenanhenry%2F' }
    },
    adriano: {
        name: 'Adriano Eloy Justino da Silva', role: 'Desenvolvedor',
        initials: 'AD', group: 'dev',
        bio: 'Movido por desafios, aprendizado contínuo e pela vontade de transformar ideias em soluções reais através da tecnologia.',
        links: { github: 'https://github.com/AdrianoABR123', linkedin: 'https://www.linkedin.com/in/adriano-eloy-a703b4309/' }
    },

    victor: {
        name: 'Victor Montes da Silva', role: 'Desenvolvedor',
        initials: 'VM', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em iniciação científica e conhecimento acadêmico voltados a projetos da liga.',
        links: { github: 'https://github.com/VmDevalt', linkedin: 'https://www.linkedin.com/in/victor-montes-97bbb51a3/' }
    },

    kayllane: {
        name: 'Kayllane Maria Dias Vasconcelos',
        role: 'Desenvolvedor',
        initials: 'KA',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico e entrega de valor nos projetos da liga.',
        links: {
            github: 'https://github.com/kayvsll',
            linkedin: 'https://www.linkedin.com/in/kayvsll/',
        },
    },
    matheus: {
        name: 'Matheus da Silva Melo',
        role: 'Desenvolvedor',
        initials: 'MM', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico, network e entrega de valor nos projetos da liga.',
        links: {
            github: 'https://github.com/matheusbalcky',
            linkdin: 'https://www.linkedin.com/in/matheusbalcky'
        }
    },

    ryan: {
        name: 'Ryan Raiconny Nobre Nascimento ',
        role: 'Desenvolvedor',
        initials: 'RY', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em crescimento técnico, network e entrega de valor nos projetos da liga.',
        links: {
            github: 'hhttps://github.com/ryan-star232',
            linkdin: 'https://www.linkedin.com/in/ryan-nobre-56aa943a2/'
        }
    },

    victor: {
        name: 'Victor Montes da Silva', role: 'Desenvolvedor',
        initials: 'VM', group: 'dev',
        bio: 'Membro desenvolvedor da LES, focado em iniciação científica e conhecimento acadêmico voltados a projetos da liga.',
        links: { github: 'https://github.com/VmDevalt', linkedin: 'https://www.linkedin.com/in/victor-montes-97bbb51a3/' }
    },

    felipe: {
        name: 'Luis Felipe da Silva de Oliveira',
        role: 'Desenvolvedor',
        initials: 'FO', group: 'dev',
        bio: 'Membro desenvolvedor da LES, com foco em evolução técnica contínua e na entrega de valor real aos projetos.',
        links: {
            github: 'https://github.com/lFelipe23',
            linkedin: 'https://www.linkedin.com/in/luis-felipe-ads/',
        }
    },

    sabryna: {
        name: 'Sabryna Santana da Silva',
        role: 'Desenvolvedor',
        initials: 'SS', group: 'dev',
        bio: 'Membro desenvolvedor da LES, atuando nas áreas de desenvolvimento e comunicação, contribuindo com soluções criativas, crescimento técnico e fortalecimento dos projetos da liga.',
        links: {
            github: 'https://github.com/sabrynasantana',
            linkedin: 'https://www.linkedin.com/in/sabryna-santana-8150201a1/',
        }
    },
    eduarda: {
        name: 'Eduarda Rocha Fernandes de Sousa', role: 'Desenvolvedor',
        initials: 'ES', group: 'dev',
        bio: 'Membra desenvolvedora da LES, com foco em evolução técnica contínua e na entrega de valor real aos projetos.',
        links: { github: 'https://github.com/EduardaRFSousa', linkedin: 'https://www.linkedin.com/in/eduarda-rocha-full-stack-dev/' }
    },


    /* ══ COLABORADORES — adicione aqui ══════════════════════
       Exemplo:
       nomeColaborador: {
           name: 'Nome Completo', role: 'Colaborador',
           initials: 'NC', group: 'colaborador',
           bio: 'Descrição da contribuição.',
           links: { linkedin: 'https://...' }
       },
    ══════════════════════════════════════════════════════ */

    /* ══ COLABORADORES EXTERNOS — adicione aqui ═════════════
       Exemplo:
       nomeProfessor: {
           name: 'Nome Completo', role: 'Colaborador Externo',
           initials: 'NP', group: 'externo',
           bio: 'Descrição da contribuição.',
           links: { linkedin: 'https://...' }
       },
    ══════════════════════════════════════════════════════ */

    /* ══ EX INTEGRANTES — adicione aqui ══════════════════════
       Exemplo:
       nomeEx: {
           name: 'Nome Completo', role: 'Ex Integrante',
           initials: 'NE', group: 'ex_integrante',
           bio: 'Contribuições durante o período na liga.',
           links: { linkedin: 'https://...' }
       },
    ══════════════════════════════════════════════════════ */


    /* ══ EX INTEGRANTES — adicione aqui ══════════════════════*/
    francisco: {
        name: 'Francisco de Assis O. dos S. Correia', role: 'ex_integrante',
        initials: 'FA', group: 'ex_integrante',
        bio: 'Primeiro Diretor de Administração da Liga de Engenharia de Software (LES) e membro fundador',
        links: { github: 'https://github.com/francisco-tal', linkedin: 'https://www.linkedin.com/in/francisco-de-assis-53aaab3b2/' }
    },

    
    cristiano: {
        name: 'Cristiano Veras de Souza', role: 'ex_integrante',
        initials: 'CV', group: 'ex_integrante',
        bio: 'Ex-membro desenvolvedor da LES',
        links: { github: 'https://github.com/', linkedin: 'https://www.linkedin.com/in/cristianoveras/' }
    },














};


/* Ícones e rótulos dos links */
const linkIcons = {
    github: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
    linkedin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
    email: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    discord: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.113 18.1.131 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
};
const linkLabels = { github: 'GitHub', linkedin: 'LinkedIn', instagram: 'Instagram', email: 'E-mail', discord: 'Discord' };


/* ════════════════════════════════════════════════════════════
   §5  MODAL DE PERFIL INDIVIDUAL (#member-modal)
════════════════════════════════════════════════════════════ */
const memberModal = document.getElementById('member-modal');
const memberClose = document.getElementById('modal-close');

function openMemberModal(id) {
    const data = membersData[id];
    if (!data) return;

    document.getElementById('modal-avatar').textContent = data.initials;
    document.getElementById('modal-role').textContent = data.role;
    document.getElementById('modal-name').textContent = data.name;
    document.getElementById('modal-bio').textContent = data.bio;

    const linksEl = document.getElementById('modal-links');
    linksEl.innerHTML = '';
    Object.entries(data.links).forEach(([key, url]) => {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = `modal-link modal-link-${key}`;
        a.innerHTML = `${linkIcons[key] || ''}<span>${linkLabels[key] || key}</span>`;
        linksEl.appendChild(a);
    });

    memberModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMemberModal() {
    memberModal.classList.remove('open');
    if (!teamOverviewModal.classList.contains('open')) {
        document.body.style.overflow = '';
    }
}

/* Delega cliques em qualquer .member-card com data-member */
document.addEventListener('click', e => {
    const card = e.target.closest('.member-card[data-member]');
    if (card && card.dataset.member) openMemberModal(card.dataset.member);
});

memberClose.addEventListener('click', closeMemberModal);
memberModal.addEventListener('click', e => { if (e.target === memberModal) closeMemberModal(); });


/* ════════════════════════════════════════════════════════════
   §6  MODAL DE VISÃO GERAL DA EQUIPE (#team-overview-modal)
   ────────────────────────────────────────────────────────────
   Lê os .member-card[data-member] do DOM (incluindo os do
   .equipe-data-source oculto), organiza por grupo e renderiza
   com animação stagger.

   PARA ADICIONAR NOVO GRUPO:
     1. Adicione a entrada em GROUP_LABELS
     2. Adicione os dados em membersData (§4)
     3. Adicione cards em .equipe-data-source no HTML

   ORDEM DOS GRUPOS no modal — definida por GROUP_ORDER:
     Altere GROUP_ORDER para mudar a sequência de exibição.
════════════════════════════════════════════════════════════ */
const GROUP_LABELS = {
    'diretoria': 'Coordenação e Diretoria',
    'dev': 'Membros Desenvolvedores',
    'colaborador': 'Colaboradores',
    'externo': 'Colaboradores Externos',
    'ex_integrante': 'Ex Integrantes',
    /* Nova categoria:
       'pesquisa': 'Pesquisadores',
       'alumni':   'Alumni',
    */
};

/* Ordem de exibição dos grupos no modal (todos os grupos, com ou sem membros) */
const GROUP_ORDER = ['diretoria', 'dev', 'colaborador', 'externo', 'ex_integrante'];

/* Cores de destaque por grupo (para o header separador) */
const GROUP_COLORS = {
    'diretoria': 'var(--green)',
    'dev': 'var(--green)',
    'colaborador': 'var(--gray-lt)',
    'externo': '#c09030',
    'ex_integrante': 'var(--red)',
};

const teamOverviewModal = document.getElementById('team-overview-modal');
const teamOverviewClose = document.getElementById('team-overview-close');
const teamOverviewFilters = document.getElementById('team-overview-filters');
const teamOverviewGrid = document.getElementById('team-overview-grid');
const btnTeamOverview = document.getElementById('btn-team-overview');

/* Coleta membros do DOM agrupados */
function collectMembersByGroup() {
    const groups = {};
    document.querySelectorAll('.member-card[data-member]').forEach(card => {
        const group = card.dataset.group || 'outros';
        const member = card.dataset.member;
        if (!groups[group]) groups[group] = [];
        if (!groups[group].includes(member)) groups[group].push(member);
    });
    return groups;
}

/* Renderiza filtros — exibe TODOS os grupos de GROUP_ORDER,
   mesmo os que ainda não têm membros (mostra contador = 0) */
function renderTeamOverviewFilters(groups, activeFilter) {
    teamOverviewFilters.innerHTML = '';

    /* Botão "Todos" */
    const allBtn = document.createElement('button');
    allBtn.className = `team-filter-btn ${activeFilter === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'Todos';
    allBtn.addEventListener('click', () => renderTeamOverviewGrid(groups, 'all'));
    teamOverviewFilters.appendChild(allBtn);

    /* Um botão por grupo na ordem definida em GROUP_ORDER */
    GROUP_ORDER.forEach(group => {
        const label = GROUP_LABELS[group] || group;
        const count = (groups[group] || []).length;

        const btn = document.createElement('button');
        btn.className = `team-filter-btn ${activeFilter === group ? 'active' : ''} ${count === 0 ? 'empty' : ''}`;
        btn.innerHTML = `${label} <span class="filter-count">${count}</span>`;
        btn.addEventListener('click', () => renderTeamOverviewGrid(groups, group));
        teamOverviewFilters.appendChild(btn);
    });
}

/* Renderiza grade com animação stagger */
function renderTeamOverviewGrid(groups, activeFilter = 'all') {
    teamOverviewGrid.innerHTML = '';
    renderTeamOverviewFilters(groups, activeFilter);

    const groupsToRender = activeFilter === 'all'
        ? GROUP_ORDER
        : [activeFilter];

    let globalIndex = 0;

    groupsToRender.forEach(group => {
        const members = groups[group] || [];

        /* Header do grupo (sempre visível no modo "Todos") */
        if (activeFilter === 'all') {
            const header = document.createElement('div');
            header.className = 'team-overview-group-header animated';
            header.style.setProperty('--i', globalIndex++);
            header.style.setProperty('--group-color', GROUP_COLORS[group] || 'var(--green)');
            header.textContent = GROUP_LABELS[group] || group;
            teamOverviewGrid.appendChild(header);
        }

        if (members.length === 0) {
            /* Grupo vazio — exibe placeholder */
            const empty = document.createElement('div');
            empty.className = 'team-overview-empty animated';
            empty.style.setProperty('--i', globalIndex++);
            empty.innerHTML = `
                <span class="team-overview-empty-icon">—</span>
                <span>Nenhum membro neste grupo ainda.</span>`;
            teamOverviewGrid.appendChild(empty);
            return;
        }

        members.forEach(memberId => {
            const data = membersData[memberId];
            if (!data) return;

            /* Classes de avatar e role por grupo */
            let avatarClass = 'member-avatar';
            let roleClass = 'team-role';

            if (group === 'dev') {
                avatarClass = 'member-avatar dev-avatar';
                roleClass = 'team-role dev-role';
            } else if (group === 'colaborador') {
                avatarClass = 'member-avatar colaborador-avatar';
                roleClass = 'team-role colaborador-role';
            } else if (group === 'externo') {
                avatarClass = 'member-avatar externo-avatar';
                roleClass = 'team-role externo-role';
            } else if (group === 'ex_integrante') {
                avatarClass = 'member-avatar ex-avatar';
                roleClass = 'team-role ex-role';
            }

            const card = document.createElement('div');
            card.className = 'member-card animated';
            card.style.setProperty('--i', globalIndex++);
            card.dataset.member = memberId;
            card.dataset.group = group;

            card.innerHTML = `
                <div class="${avatarClass}">${data.initials}</div>
                <div class="member-info">
                    <span class="${roleClass}">${data.role}</span>
                    <strong>${data.name}</strong>
                </div>
                <svg class="member-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>`;

            teamOverviewGrid.appendChild(card);
        });
    });
}

function openTeamOverviewModal() {
    const groups = collectMembersByGroup();
    renderTeamOverviewGrid(groups, 'all');
    teamOverviewModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeTeamOverviewModal() {
    teamOverviewModal.classList.remove('open');
    if (!memberModal.classList.contains('open')) {
        document.body.style.overflow = '';
    }
}

btnTeamOverview.addEventListener('click', openTeamOverviewModal);
teamOverviewClose.addEventListener('click', closeTeamOverviewModal);
teamOverviewModal.addEventListener('click', e => {
    if (e.target === teamOverviewModal) closeTeamOverviewModal();
});

/* Atualiza o contador de membros exibido na seção */
(function updateMemberCount() {
    const total = Object.values(membersData).filter(m => m.group !== 'ex_integrante').length;
    const el = document.getElementById('equipe-member-count');
    if (el) el.textContent = total;
})();


/* ════════════════════════════════════════════════════════════
   §7  MODAL DE EVENTOS
════════════════════════════════════════════════════════════ */
const eventModal = document.getElementById('event-modal');
const eventClose = document.getElementById('event-modal-close');

function openEventModal(el) {
    const titulo = el.dataset.titulo || '';
    const data = el.dataset.data || '';
    const tipo = el.dataset.tipo || 'evento';
    const desc = el.dataset.descricao || '';
    const imgSrc = el.querySelector('img')?.src || '';
    const imgAlt = el.querySelector('img')?.alt || '';

    document.getElementById('event-modal-img').src = imgSrc;
    document.getElementById('event-modal-img').alt = imgAlt;
    document.getElementById('event-modal-title').textContent = titulo;
    document.getElementById('event-modal-date').textContent = data;
    document.getElementById('event-modal-desc').textContent = desc;

    const typeEl = document.getElementById('event-modal-type');
    typeEl.textContent = tipo.toUpperCase();
    typeEl.className = 'event-modal-type' + (tipo === 'evento' ? ' tipo-evento' : '');

    eventModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    eventModal.classList.remove('open');
    document.body.style.overflow = '';
}

document.querySelectorAll('.eventos1, .eventos2').forEach(ev => {
    ev.addEventListener('click', () => openEventModal(ev));
});

eventClose.addEventListener('click', closeEventModal);
eventModal.addEventListener('click', e => { if (e.target === eventModal) closeEventModal(); });


/* ════════════════════════════════════════════════════════════
   §8  CONTAGEM REGRESSIVA DO INGRESSO + MODAL DE FASES
   ────────────────────────────────────────────────────────────
   CONFIGURAÇÃO — edite apenas INGRESSO_CONFIG para ajustar datas.

   FASES:
     1 → Antes de dataAberturaInscricoes
         Botão abre modal com informações sobre a seleção futura

     2 → Entre dataAberturaInscricoes e dataEncerramentoInscricoes
         Botão abre modal com link do formulário + informações

     3 → A partir de dataEncerramentoInscricoes
         Avisa que a inscrição é semestral.
         
   FORMATO DAS DATAS: new Date(ano, mês-1, dia)
════════════════════════════════════════════════════════════ */
const INGRESSO_CONFIG = {
    /* ── Datas do processo ── */
    dataAberturaInscricoes: new Date(2026, 3, 23),   /* 23/04/2026 */
    dataEncerramentoInscricoes: new Date(2026, 3, 26),   /* 26/04/2026 */

    /* ── Textos da contagem ── */
    textoFase1: 'Inscrições abrem em',
    textoFase2: 'Inscrições encerram em',

    /* ── Link do formulário (Fase 2) ── */
    linkFormulario: 'https://forms.gle/j5fYk6yR4D4mCH9j7',
};

/* ── Elementos do DOM ── */
const $ctaBtn = document.getElementById('ingresso-cta-btn');
const $countdownBlock = document.getElementById('ingresso-countdown-block');
const $countdownLabel = document.getElementById('ingresso-countdown-label');
const $semestralBlock = document.getElementById('ingresso-semestral-block');
const $cdDays = document.getElementById('cd-days');
const $cdHours = document.getElementById('cd-hours');
const $cdMins = document.getElementById('cd-mins');
const $cdSecs = document.getElementById('cd-secs');

/* ── Modal de ingresso ── */
const $ingressoModal = document.getElementById('ingresso-modal');
const $ingressoModalContent = document.getElementById('ingresso-modal-content');
const $ingressoModalClose = document.getElementById('ingresso-modal-close');

function openIngressoModal(html) {
    $ingressoModalContent.innerHTML = html;
    $ingressoModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeIngressoModal() {
    $ingressoModal.classList.remove('open');
    document.body.style.overflow = '';
}

$ingressoModalClose.addEventListener('click', closeIngressoModal);
$ingressoModal.addEventListener('click', e => { if (e.target === $ingressoModal) closeIngressoModal(); });

/* ── Conteúdo dos modais por fase ── */
function getModalFase1() {
    return `
        <div style="margin-bottom:1.25rem">
            <span style="font-family:var(--font-head);font-size:0.7rem;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--green)">Processo Seletivo Semestral</span>
            <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,4vw,2.2rem);color:var(--white);line-height:1.1;margin-top:0.4rem">Ingresso LES-IFPE</h2>
            <p style="font-size:0.88rem;color:var(--gray-lt);margin-top:0.5rem">O ingresso na Liga de Engenharia de Software é <strong style="color:var(--white)">semestral</strong>. As inscrições abrirão em breve. Confira as etapas do processo:</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
            <div style="border:1px solid rgba(0,166,81,0.2);border-left:3px solid var(--green);border-radius:6px;padding:1rem 1.25rem;background:rgba(0,166,81,0.04)">
                <p style="font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin:0 0 0.4rem">1ª Etapa — Teste de Nivelamento</p>
                <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.65;margin:0">Avaliação <strong style="color:var(--white)">não eliminatória</strong> com o objetivo de identificar seu nível atual de conhecimento em programação. Não é necessário saber tudo — queremos apenas compreender seu ponto de partida.</p>
            </div>
            <div style="border:1px solid rgba(255,255,255,0.08);border-left:3px solid rgba(255,255,255,0.2);border-radius:6px;padding:1rem 1.25rem;background:rgba(255,255,255,0.02)">
                <p style="font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,245,240,0.6);margin:0 0 0.4rem">2ª Etapa — Entrevista</p>
                <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.65;margin:0">Conversa individual para conhecer melhor você, suas motivações e seu perfil. O objetivo é avaliar sua afinidade com a área de Engenharia de Software e com a Liga.</p>
            </div>
        </div>
        <p style="font-size:0.8rem;color:rgba(245,245,240,0.35);margin-top:1.25rem;text-align:center">Acompanhe nosso Instagram <strong style="color:rgba(245,245,240,0.55)">@les.ifpe</strong> para ser avisado quando as inscrições abrirem.</p>
    `;
}

function getModalFase2() {
    return `
        <div style="margin-bottom:1.25rem">
            <span style="font-family:var(--font-head);font-size:0.7rem;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--green)">Inscrições Abertas · Seleção Semestral</span>
            <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,4vw,2.2rem);color:var(--white);line-height:1.1;margin-top:0.4rem">Ingresso LES-IFPE</h2>
            <p style="font-size:0.88rem;color:var(--gray-lt);margin-top:0.5rem">As inscrições estão abertas! O processo é <strong style="color:var(--white)">semestral</strong>. Inscreva-se pelo formulário e confira as etapas:</p>
        </div>
        <a href="${INGRESSO_CONFIG.linkFormulario}" target="_blank" rel="noopener noreferrer"
            style="display:flex;align-items:center;justify-content:center;gap:0.6rem;width:100%;padding:0.9rem 1.5rem;background:var(--green);color:var(--black);font-family:var(--font-head);font-size:0.9rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;border-radius:4px;text-decoration:none;margin-bottom:1.25rem;transition:background 0.2s"
            onmouseover="this.style.background='var(--green-d)';this.style.color='var(--white)'"
            onmouseout="this.style.background='var(--green)';this.style.color='var(--black)'">
            Acessar Formulário de Inscrição
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <div style="display:flex;flex-direction:column;gap:1rem">
            <div style="border:1px solid rgba(0,166,81,0.2);border-left:3px solid var(--green);border-radius:6px;padding:1rem 1.25rem;background:rgba(0,166,81,0.04)">
                <p style="font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin:0 0 0.4rem">1ª Etapa — Teste de Nivelamento</p>
                <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.65;margin:0">Avaliação <strong style="color:var(--white)">não eliminatória</strong> com o objetivo de identificar seu nível atual de conhecimento em programação. Não é necessário saber tudo — queremos apenas compreender seu ponto de partida.</p>
            </div>
            <div style="border:1px solid rgba(255,255,255,0.08);border-left:3px solid rgba(255,255,255,0.2);border-radius:6px;padding:1rem 1.25rem;background:rgba(255,255,255,0.02)">
                <p style="font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,245,240,0.6);margin:0 0 0.4rem">2ª Etapa — Entrevista</p>
                <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.65;margin:0">Conversa individual para conhecer melhor você, suas motivações e seu perfil. O objetivo é avaliar sua afinidade com a área de Engenharia de Software e com a Liga.</p>
            </div>
        </div>
    `;
}

function getModalFase3() {
    return `
        <div style="text-align:center;padding:0.5rem 0 1.5rem">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style="font-family:var(--font-head);font-size:0.7rem;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--red);display:block;margin-bottom:0.5rem">Inscrições Encerradas</span>
            <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,4vw,2.2rem);color:var(--white);line-height:1.1;margin-bottom:0.75rem">Processo encerrado</h2>
            <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.7;max-width:400px;margin:0 auto">O cadastro para esta edição foi encerrado. O ingresso na LES é <strong style="color:var(--white)">semestral</strong> — a próxima turma abrirá inscrições em breve.</p>
        </div>
        <p style="font-size:0.8rem;color:rgba(245,245,240,0.35);text-align:center;margin-top:0.5rem">Fique de olho no Instagram <strong style="color:rgba(245,245,240,0.55)">@les.ifpe</strong> para não perder a próxima edição.</p>
    `;
}

function getModalFase4() {
    return `
        <div style="text-align:center;padding:0.5rem 0 1rem">
            <span style="font-family:var(--font-head);font-size:0.7rem;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--gray-lt);display:block;margin-bottom:0.5rem">Processo Seletivo</span>
            <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,4vw,2.2rem);color:var(--white);line-height:1.1;margin-bottom:0.75rem">Seleção Semestral</h2>
            <p style="font-size:0.88rem;color:var(--gray-lt);line-height:1.7;max-width:400px;margin:0 auto">O ingresso na LES-IFPE acontece <strong style="color:var(--white)">a cada semestre</strong>. Acompanhe nosso Instagram <strong style="color:var(--white)">@les.ifpe</strong> para ser avisado sobre as próximas inscrições.</p>
        </div>
    `;
}

/* Fase atual da lógica (atualizada pelo timer) */
let ingressoFaseAtual = null;

/* Formata número com zero à esquerda */
function pad(n) { return String(n).padStart(2, '0'); }

/* Calcula diferença D/H/M/S */
function calcDiff(target) {
    const diff = Math.max(0, target - Date.now());
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
    };
}

/* Pulso visual nos segundos */
let lastSec = -1;
function tickPulse(sec) {
    if (sec !== lastSec) {
        lastSec = sec;
        $cdSecs.classList.remove('tick');
        void $cdSecs.offsetWidth;
        $cdSecs.classList.add('tick');
        setTimeout(() => $cdSecs.classList.remove('tick'), 200);
    }
}

function updateIngressoCountdown() {
    const cfg = INGRESSO_CONFIG;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* FASE 3 */
    const diaAposEnc = new Date(cfg.dataEncerramentoInscricoes);
    diaAposEnc.setDate(diaAposEnc.getDate() + 1);

    if (today >= diaAposEnc) {
        if (ingressoFaseAtual !== 4) {
            ingressoFaseAtual = 4;
            $countdownBlock.style.display = 'none';
            $semestralBlock.style.display = 'flex';
            $ctaBtn.style.display = 'none';
            clearInterval(ingressoTimer);
        }
        return;
    }

    /* FASE 2 */
    if (today >= cfg.dataAberturaInscricoes) {
        ingressoFaseAtual = 2;
        $countdownBlock.style.display = 'flex';
        $semestralBlock.style.display = 'none';
        $ctaBtn.style.display = '';
        $countdownBlock.dataset.fase = '2';
        $countdownLabel.textContent = cfg.textoFase2;

        const target = new Date(cfg.dataEncerramentoInscricoes);
        target.setHours(23, 59, 59, 999);
        const d = calcDiff(target);
        $cdDays.textContent = pad(d.days);
        $cdHours.textContent = pad(d.hours);
        $cdMins.textContent = pad(d.mins);
        $cdSecs.textContent = pad(d.secs);
        tickPulse(d.secs);
        return;
    }

    /* FASE 1 */
    ingressoFaseAtual = 1;
    $countdownBlock.style.display = 'flex';
    $semestralBlock.style.display = 'none';
    $ctaBtn.style.display = '';
    $countdownBlock.dataset.fase = '1';
    $countdownLabel.textContent = cfg.textoFase1;

    const d = calcDiff(cfg.dataAberturaInscricoes);
    $cdDays.textContent = pad(d.days);
    $cdHours.textContent = pad(d.hours);
    $cdMins.textContent = pad(d.mins);
    $cdSecs.textContent = pad(d.secs);
    tickPulse(d.secs);
}

updateIngressoCountdown();
const ingressoTimer = setInterval(updateIngressoCountdown, 1000);


/*
   INTERCEPTA O CLIQUE NO BOTÃO DE INGRESSO
   Todas as fases abrem o modal com conteúdo adequado.
   Fase 2: também há link direto para o formulário dentro do modal.
*/
$ctaBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (ingressoFaseAtual === 1) openIngressoModal(getModalFase1());
    else if (ingressoFaseAtual === 2) openIngressoModal(getModalFase2());
    else if (ingressoFaseAtual === 3) openIngressoModal(getModalFase3());
});


/* ════════════════════════════════════════════════════════════
   FECHAR MODAIS COM ESC — do mais interno para o mais externo
════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (memberModal.classList.contains('open')) closeMemberModal();
    else if (eventModal.classList.contains('open')) closeEventModal();
    else if (teamOverviewModal.classList.contains('open')) closeTeamOverviewModal();
    else if ($ingressoModal.classList.contains('open')) closeIngressoModal();
});