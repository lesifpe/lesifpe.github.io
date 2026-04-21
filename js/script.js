/* ============================================================
   LES – LIGA DE ENGENHARIA DE SOFTWARE | IFPE Recife
   main.js — Animações, scroll reveal, header dinâmico
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. BODY LOADED ───────────────────────────────────── */
  requestAnimationFrame(() => document.body.classList.add('loaded'));


  /* ── 2. SCROLL REVEAL (IntersectionObserver) ──────────── */
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
    { selector: '.project-card',                 cls: 'reveal' },
  ];

  revealTargets.forEach(({ selector, cls }) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add(cls);
      if (i > 0) el.style.transitionDelay = `${Math.min(i * 0.08, 0.5)}s`;
      revealObserver.observe(el);
    });
  });


  /* ── 3. PARALLAX SUAVE NO HERO ────────────────────────── */
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      document.querySelectorAll('.hero-slide.active img').forEach(img => {
        img.style.transform = `scale(1) translateY(${y * 0.25}px)`;
      });
    }
  }, { passive: true });


  /* ── 4. SCROLL HINT INJECT ────────────────────────────── */
  const firstSection = document.querySelector('.main > section:first-child');
  if (firstSection) {
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML = `<span>Scroll</span><div class="arrow"></div>`;
    firstSection.appendChild(hint);

    window.addEventListener('scroll', () => {
      hint.style.opacity = window.scrollY > 80 ? '0' : '';
    }, { passive: true });
  }


  /* ── 5. TÍTULOS DOS PILARES INJECT ───────────────────── */
  const pilarData = {
    'TransformaçãoDigital': 'Transformação Digital',
    'MetodologiasAgeis':    'Metodologias Ágeis',
    'ImpactoSocial':        'Impacto Social',
  };

  Object.entries(pilarData).forEach(([id, title]) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Only inject if h3 not already present
    if (el.querySelector('h3')) return;
    const tag = document.createElement('h3');
    tag.textContent = title;
    el.insertBefore(tag, el.firstChild);
  });


  /* ── 6. TÍTULO HERO — DESTAQUE ────────────────────────── */
  const h1 = document.querySelector('.LIGA h1');
  if (h1) {
    const text = h1.textContent;
    h1.innerHTML = text.replace('LIGA', '<span class="accent">LIGA</span>');
  }


  /* ── 7. SMOOTH SCROLL NOS LINKS DO MENU ───────────────── */
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


  /* ── 8. CURSOR GLOW SUTIL ─────────────────────────────── */
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


  /* ── 9. CONTADORES ANIMADOS ───────────────────────────── */
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


  /* ── 10. EFEITO GLITCH NO H1 DO HERO ─────────────────── */
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
/* ── 11. ocultador de link do forms no canto inferior esquerdo ─────────────────── */
function abrirFormulario() {
    window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLSfbTDmrQTLmwpWn_vNgo0tGHQ27Bfm2fE39ottHrm0671m9Mw/viewform?usp=publish-editor",
        "_blank"
    );
}