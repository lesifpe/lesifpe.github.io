/* ============================================================
   LES – LIGA DE ENGENHARIA DE SOFTWARE | IFPE Recife
   main.js — Animações, scroll reveal, header dinâmico
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. BODY LOADED (dispara animação de zoom do hero) ─── */
  requestAnimationFrame(() => document.body.classList.add('loaded'));


  /* ── 2. HEADER SCROLL ─────────────────────────────────── */
  const header = document.querySelector('.header');

  const toggleHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', toggleHeader, { passive: true });
  toggleHeader();


  /* ── 3. SCROLL REVEAL (IntersectionObserver) ──────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  // Adiciona classes reveal em elementos-alvo
  const revealTargets = [
    { selector: '#equipe .team-section',         cls: 'reveal' },
    { selector: '.team-list li',                 cls: 'reveal' },
    { selector: '.timeline-item',               cls: 'reveal-left' },
    { selector: '.historia-texto p',             cls: 'reveal' },
    { selector: '#TransformaçãoDigital',         cls: 'reveal' },
    { selector: '#MetodologiasAgeis',            cls: 'reveal' },
    { selector: '#ImpactoSocial',               cls: 'reveal' },
    { selector: '.eventos1, .eventos2',          cls: 'reveal' },
    { selector: '#parte_nossa_equipe H2',        cls: 'reveal' },
    { selector: '#parte_nossa_equipe h3',        cls: 'reveal' },
    { selector: '#parte_nossa_equipe .cta-btn',  cls: 'reveal' },
    { selector: '#parte_nossa_equipe .cta-sub',  cls: 'reveal' },
    { selector: 'main > section h2',            cls: 'reveal' },
    { selector: 'main > section > p',           cls: 'reveal' },
    { selector: '.historia h2',                  cls: 'reveal' },
  ];

  revealTargets.forEach(({ selector, cls }) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add(cls);
      // stagger por índice
      if (i > 0) el.style.transitionDelay = `${Math.min(i * 0.08, 0.5)}s`;
      revealObserver.observe(el);
    });
  });


  /* ── 4. PARALLAX SUAVE NO HERO ────────────────────────── */
  const heroImg = document.querySelector('.ifpe_img img');

  if (heroImg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroImg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
      }
    }, { passive: true });
  }


  /* ── 5. SCROLL HINT INJECT ────────────────────────────── */
  const firstSection = document.querySelector('.main > section:first-child');
  if (firstSection) {
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML = `<span>Scroll</span><div class="arrow"></div>`;
    firstSection.appendChild(hint);

    // Esconde ao rolar
    window.addEventListener('scroll', () => {
      hint.style.opacity = window.scrollY > 80 ? '0' : '';
    }, { passive: true });
  }


  /* ── 6. TÍTULOS DOS PILARES INJECT ───────────────────── */
  const pilarData = {
    'TransformaçãoDigital': 'Transformação Digital',
    'MetodologiasAgeis':    'Metodologias Ágeis',
    'ImpactoSocial':        'Impacto Social',
  };

  Object.entries(pilarData).forEach(([id, title]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const tag = document.createElement('h3');
    tag.textContent = title;
    tag.style.cssText = `
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #f5f5f0;
      margin-bottom: 0.75rem;
      position: relative;
      z-index: 1;
    `;
    el.insertBefore(tag, el.firstChild);
  });

  // Grade de pilares
  const pilaresSection = document.getElementById('pilares');
  if (pilaresSection) {
    const divs = ['TransformaçãoDigital', 'MetodologiasAgeis', 'ImpactoSocial']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (divs.length === 3) {
      const grid = document.createElement('div');
      grid.className = 'pilares-grid';
      divs.forEach(d => grid.appendChild(d));
      pilaresSection.appendChild(grid);
    }
  }


  /* ── 7. TÍTULO HERO — DESTAQUE ────────────────────────── */
  const h1 = document.querySelector('.LIGA h1');
  if (h1) {
    const text = h1.textContent;
    // Destaca "LIGA" em vermelho
    h1.innerHTML = text.replace('LIGA', '<span class="accent">LIGA</span>');
  }


  /* ── 8. BOTÃO CTA INJECT ──────────────────────────────── */
  const ctaContainer = document.getElementById('parte_nossa_equipe');
  if (ctaContainer) {
    // Remove o <BUTton> original
    const oldBtn = ctaContainer.querySelector('button, BUTton');
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement('a');
    btn.href = '#';
    btn.className = 'cta-btn';
    btn.innerHTML = `
      <span>Quero Fazer Parte</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;

    const sub = document.createElement('span');
    sub.className = 'cta-sub';
    sub.textContent = 'Seleção aberta · IFPE Campus Recife';

    ctaContainer.appendChild(btn);
    ctaContainer.appendChild(sub);
  }


  /* ── 9. SMOOTH SCROLL NOS LINKS DO MENU ───────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ── 10. CURSOR GLOW SUTIL ────────────────────────────── */
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,166,81,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
    transition: left 0.12s ease, top 0.12s ease;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });


  /* ── 11. CONTADORES ANIMADOS (quando visíveis) ────────── */
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.floor(ease * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  // Pequena estatística no hero (injeta se quiser)
  const ligaDiv = document.querySelector('.LIGA');
  if (ligaDiv) {
    const stats = document.createElement('div');
    stats.style.cssText = `
      display: flex; gap: 2.5rem; margin-top: 2.5rem;
      opacity: 0; animation: fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 1.1s forwards;
    `;
    stats.innerHTML = `
      <div style="text-align:center">
        <div class="stat-num" data-target="11" style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:#00a651;line-height:1">0</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888">Membros</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.1)"></div>
      <div style="text-align:center">
        <div class="stat-num" data-target="3" style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:#00a651;line-height:1">0</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888">Projetos</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.1)"></div>
      <div style="text-align:center">
        <div class="stat-num" data-target="2026" style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:#cc0000;line-height:1">0</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888">Fundada</div>
      </div>
    `;
    ligaDiv.appendChild(stats);

    // Inicia contadores ao aparecerem
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.stat-num').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target));
        });
        counterObs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counterObs.observe(stats);
  }


  /* ── 12. EFEITO GLITCH NO H1 DO HERO ─────────────────── */
  const heroH1 = document.querySelector('.LIGA h1');
  if (heroH1) {
    heroH1.addEventListener('mouseenter', () => {
      heroH1.style.textShadow = '2px 0 #cc0000, -2px 0 #00a651';
      setTimeout(() => {
        heroH1.style.textShadow = '1px 0 #cc0000, -1px 0 #00a651';
        setTimeout(() => { heroH1.style.textShadow = ''; }, 100);
      }, 80);
    });
  }

});

