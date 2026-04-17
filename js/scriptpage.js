 /* ════════════════════════════════════════════════════════
       HAMBURGER MENU
    ════════════════════════════════════════════════════════ */
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


    /* ════════════════════════════════════════════════════════
       HERO SLIDESHOW
       Adicione mais imagens ao array heroImages para
       incluir novos slides no hero.
    ════════════════════════════════════════════════════════ */
    const heroImages = [
        { src: 'assets/imagens/capa/fachadacampusrecife.jpg', alt: 'IFPE Campus Recife — Fachada' },
        { src: 'assets/imagens/capa/CAPA.jpg', alt: 'Workshop LES' },
         { src: 'assets/imagens/capa/CAPA1.jpg', alt: 'Workshop LES' },
    ];

    const slideshowEl  = document.getElementById('heroSlideshow');
    const slideDotsEl  = document.getElementById('slideDots');
    let currentSlide   = 0;
    let slideTimer     = null;

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
        const dots   = slideDotsEl.querySelectorAll('.slide-dot');
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = (index + heroImages.length) % heroImages.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        clearInterval(slideTimer);
        slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
    }

    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);


    /* ════════════════════════════════════════════════════════
       PROJETOS — CARROSSEL
    ════════════════════════════════════════════════════════ */
    const track     = document.getElementById('projectsTrack');
    const dotsWrap  = document.getElementById('carouselDots');
    const prevBtn   = document.getElementById('prevBtn');
    const nextBtn   = document.getElementById('nextBtn');

    function buildCarousel() {
        const cards = track.querySelectorAll('.project-card');
        const total = cards.length;
        if (total <= 1) return;

        let current = 0;
        let cardW   = 0;

        function getCardWidth() {
            return cards[0].getBoundingClientRect().width + 24; // gap = 1.5rem = 24px
        }

        dotsWrap.innerHTML = '';
        cards.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', `Projeto ${i + 1}`);
            d.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(d);
        });

        function updateDots() {
            dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
            prevBtn.disabled = current === 0;
            nextBtn.disabled = current === total - 1;
        }

        function goTo(index) {
            cardW = getCardWidth();
            current = Math.max(0, Math.min(index, total - 1));
            track.style.transform = `translateX(-${current * cardW}px)`;
            updateDots();
        }

        prevBtn.addEventListener('click', () => goTo(current - 1));
        nextBtn.addEventListener('click', () => goTo(current + 1));

        // Recalculate on resize
        window.addEventListener('resize', () => goTo(current));

        updateDots();
    }

    buildCarousel();


    /* ════════════════════════════════════════════════════════
       MODAL MEMBROS
    ════════════════════════════════════════════════════════ */
    const membersData = {
        rafael: {
            name: 'Prof. Dr. Rafael Roque Aschoff',
            role: 'Coordenador do Projeto',
            initials: 'RA',
            bio: 'Professor e pesquisador do IFPE Campus Recife. Coordena a Liga de Engenharia de Software, promovendo a formação prática e o desenvolvimento de soluções tecnológicas com impacto real na comunidade.',
            links: {
                github:   'https://github.com/roque86',
                email:    'mailto:rafael.aschoff@recife.ifpe.edu.br',
            }
        },

          
        Hilson: {
            name: 'Prof. Hilson Andrade',
            role: 'Diretor de extenção do IFPE',
            initials: 'HI',
            bio: 'Professor e pesquisador do IFPE Campus Recife que, há mais de vinte anos, utiliza a ciência e a tecnologia para resolver problemas. Doutorando em Engenharia da Computação, Mestre em Ciências da Computação, Engenheiro Eletrônico e técnico em Eletrotécnica, coordena a Liga de Engenharia de Software, promovendo a formação prática e o desenvolvimento de soluções tecnológicas com impacto real na comunidade.',
            links: {
               
                linkedin: 'https://www.linkedin.com/in/hilson-andrade-36719344/',
                email:    'hilsonvilar@recife.ifpe.edu.br',
                instagram: 'https://www.instagram.com/hilson_gva/',
            }
        },
        ilian: {
            name: 'Ilian Solano Bezerra da Silva',
            role: 'Presidente',
            initials: 'IS',
            bio: 'Presidente da LES-IFPE. Lidera a equipe com foco em inovação, gestão de pessoas e articulação institucional da liga.',
            links: { github: 'https://github.com/ilian-oss', linkedin: 'https://www.linkedin.com/in/ilian-solano/',  }
        },
        yuri: {
            name: 'Yuri Santos de Oliveira',
            role: 'Vice-presidente',
            initials: 'YO',
            bio: 'Vice-presidente da LES, responsável por apoiar a presidência na coordenação estratégica e operacional da liga.',
            links: { github: 'https://github.com/Yuriportf', linkedin: 'https://www.linkedin.com/in/yuri-oliveira-aqui/', instagram: 'https://www.instagram.com/_yurioliv_/', email:    'mailto:yuriprodeveloper@gmail.com',}
        },
        christoph: {
            name: 'Christoph Soares Diehl',
            role: 'Diretor de Projetos',
            initials: 'CD',
            bio: 'Diretor de Projetos da LES. Gerencia o portfólio de projetos, garantindo alinhamento técnico e entrega de valor para a comunidade.',
            links: { github: 'https://github.com/christoph-sd', linkedin: 'https://linkedin.com/in/',  }
        },
        alane: {
            name: 'Maria Alane Oliveira de Arruda Camara',
            role: 'Diretora de Desenvolvimento',
            initials: 'MA',
            bio: 'Diretora de Desenvolvimento da LES. Coordena as práticas técnicas, revisão de código e evolução das competências dos membros desenvolvedores.',
            links: { github: 'https://github.com/AlaneOliveira', linkedin: 'https://linkedin.com/in/', }
        },
        francisco: {
            name: 'Francisco de Assis O. dos S. Correia',
            role: 'Diretor de Administração',
            initials: 'FA',
            bio: 'Diretor de Administração da LES. Responsável pela gestão administrativa, documentação e processos internos da liga.',
            links: { github: 'https://github.com/francisco-tal', linkedin: 'https://www.linkedin.com/in/francisco-de-assis-53aaab3b2/?utm_source=share_via&utm_content=profile&utm_medium=member_android', }
        },
        lucas: {
            name: 'Lucas Furtado de Matos',
            role: 'Desenvolvedor',
            initials: 'LF',
            bio: 'Membro desenvolvedor da LES, atuando no desenvolvimento de projetos com impacto na comunidade acadêmica do IFPE.',
            links: { github: 'https://github.com/lfurtadomatos', linkedin: 'https://linkedin.com/in/',  }
        },
        cristiano: {
            name: 'Cristiano Veras de Souza',
            role: 'Desenvolvedor',
            initials: 'CV',
            bio: 'Membro desenvolvedor da LES, contribuindo com suas habilidades técnicas para os projetos da liga.',
            links: { github: 'https://github.com/', linkedin: 'https://www.linkedin.com/in/cristianoveras/?utm_source=share_via&utm_content=profile&utm_medium=member_ios', }
        },
        guilherme: {
            name: 'Guilherme Nascimento F. de Barros Moraes',
            role: 'Desenvolvedor',
            initials: 'GN',
            bio: 'Membro desenvolvedor da LES, engajado no desenvolvimento de soluções tecnológicas e aprendizado contínuo.',
            links: { github: 'https://github.com/Guinfbm', linkedin: 'https://www.linkedin.com/in/guilherme-nascimento-f-b-moraes-1a70a8348/',  }
        },
        paulo: {
            name: 'Paulo de Tarso Olímpio Gomes da Silva',
            role: 'Desenvolvedor',
            initials: 'PT',
            bio: 'Membro desenvolvedor da LES, colaborando ativamente com os projetos e iniciativas técnicas da liga.',
            links: { github: 'https://github.com/Paulo-Novbr', linkedin: 'https://www.linkedin.com/in/paulo-ol%C3%ADmpio-a96156339/?utm_source=share_via&utm_content=profile&utm_medium=member_android',  }
        },
        bruno: {
            name: 'Bruno Luiz da Silva',
            role: 'Desenvolvedor',
            initials: 'BL',
            bio: 'Membro desenvolvedor da LES, focado em crescimento técnico e entrega de valor nos projetos da liga.',
            links: { github: 'https://github.com/Bruno-0706', linkedin: 'hhttps://www.linkedin.com/in/bruno-luiz-b86792339/?utm_source=share_via&utm_content=profile&utm_medium=member_android',  }
        },
    };

    const linkIcons = {
        github: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
        linkedin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
        instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
        email: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        discord: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.113 18.1.131 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
    };

    const linkLabels = { github: 'GitHub', linkedin: 'LinkedIn', instagram: 'Instagram', email: 'E-mail', discord: 'Discord' };

    const memberModal  = document.getElementById('member-modal');
    const memberClose  = document.getElementById('modal-close');

    function openMemberModal(id) {
        const data = membersData[id];
        if (!data) return;
        document.getElementById('modal-avatar').textContent = data.initials;
        document.getElementById('modal-role').textContent   = data.role;
        document.getElementById('modal-name').textContent   = data.name;
        document.getElementById('modal-bio').textContent    = data.bio;
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
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.member-card').forEach(card => {
        card.addEventListener('click', () => openMemberModal(card.dataset.member));
    });
    memberClose.addEventListener('click', closeMemberModal);
    memberModal.addEventListener('click', e => { if (e.target === memberModal) closeMemberModal(); });


    /* ════════════════════════════════════════════════════════
       MODAL EVENTOS
       Lê os atributos data-* de cada .eventos1/.eventos2
       e abre o modal com título, data, tipo e descrição.
    ════════════════════════════════════════════════════════ */
    const eventModal  = document.getElementById('event-modal');
    const eventClose  = document.getElementById('event-modal-close');

    function openEventModal(el) {
        const titulo  = el.dataset.titulo  || '';
        const data    = el.dataset.data    || '';
        const tipo    = el.dataset.tipo    || 'evento';
        const desc    = el.dataset.descricao || '';
        const imgSrc  = el.querySelector('img')?.src || '';
        const imgAlt  = el.querySelector('img')?.alt || '';

        document.getElementById('event-modal-img').src    = imgSrc;
        document.getElementById('event-modal-img').alt    = imgAlt;
        document.getElementById('event-modal-title').textContent = titulo;
        document.getElementById('event-modal-date').textContent  = data;
        document.getElementById('event-modal-desc').textContent  = desc;

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


    /* ── Fecha qualquer modal com ESC ─── */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeMemberModal(); closeEventModal(); }
    });