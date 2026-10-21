document.documentElement.classList.add('js');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu.hidden = false;
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
window.matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

// Keep all services in HTML; enhance the catalog into a photographic carousel.
const catalog = document.querySelector('#catalog');
if (catalog) {
  const cards = [...catalog.querySelectorAll('.catalog-card')];
  const filters = [...catalog.querySelectorAll('[data-filter]')];
  const toolbar = catalog.querySelector('.catalog-toolbar');
  const status = catalog.querySelector('.catalog-status');
  const track = catalog.querySelector('#catalog-items');
  const previous = catalog.querySelector('[data-slide-prev]');
  const next = catalog.querySelector('[data-slide-next]');
  const progress = catalog.querySelector('.catalog-progress-fill');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let category = 'all';
  let current = 0;
  let frame = 0;
  let animation = 0;
  let drag;
  let metrics = [];
  const matchingCards = () => cards.filter(card => category === 'all' || card.dataset.category === category);
  const position = card => card.offsetLeft;
  const measure = () => {
    metrics = matchingCards().map(card => ({card, left: position(card), width: card.offsetWidth}));
  };
  const paint = () => {
    frame = 0;
    const matches = metrics.map(item => item.card);
    const left = track.scrollLeft;
    let closest = Infinity;
    metrics.forEach(({card, left: cardLeft, width}, index) => {
      const distance = (cardLeft - left) / (width + 24);
      if (Math.abs(distance) < closest) { closest = Math.abs(distance); current = index; }
      const depth = Math.min(Math.abs(distance), 2);
      card.style.setProperty('--slide-lift', `${motion.matches ? 0 : depth * 18}px`);
      card.style.setProperty('--slide-scale', motion.matches ? 1 : 1 - depth * .035);
      card.style.setProperty('--slide-turn', `${motion.matches ? 0 : Math.max(-2, Math.min(2, distance)) * 1.25}deg`);
      card.style.setProperty('--image-shift', `${motion.matches ? 0 : Math.max(-1, Math.min(1, distance)) * -12}px`);
    });
    matches.forEach((card, index) => card.classList.toggle('is-active', index === current));
    const label = `${String(current + 1).padStart(2, '0')} / ${String(matches.length).padStart(2, '0')}`;
    if (status.textContent !== label) status.textContent = label;
    previous.disabled = current === 0;
    next.disabled = current === matches.length - 1;
    progress.style.width = `${100 / matches.length}%`;
    progress.style.transform = `translateX(${current * 100}%)`;
  };
  const schedulePaint = () => { if (!frame) frame = requestAnimationFrame(paint); };
  const stopAnimation = () => {
    cancelAnimationFrame(animation);
    animation = 0;
  };
  const goTo = index => {
    stopAnimation();
    const target = metrics[Math.max(0, Math.min(metrics.length - 1, index))].left;
    const start = track.scrollLeft;
    const started = performance.now();
    track.classList.add('is-settling');
    const step = now => {
      const t = motion.matches ? 1 : Math.min(1, (now - started) / 420);
      track.scrollTo({left: start + (target - start) * (1 - (1 - t) ** 3), behavior: 'instant'});
      schedulePaint();
      if (t < 1) animation = requestAnimationFrame(step);
      else {
        animation = 0;
        track.classList.remove('is-settling');
      }
    };
    animation = requestAnimationFrame(step);
  };
  const updateCatalog = () => {
    stopAnimation();
    track.classList.remove('is-settling');
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    current = 0;
    track.scrollTo({left: 0, behavior: 'instant'});
    measure();
    paint();
  };
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    updateCatalog();
  }));
  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('scroll', schedulePaint, {passive: true});
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? matchingCards().length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('focusin', event => {
    if (drag) return;
    const card = event.target.closest('.catalog-card');
    if (card) goTo(matchingCards().indexOf(card));
  });
  // Native touch scrolling; mouse dragging follows the same snap points.
  track.addEventListener('pointerdown', event => {
    stopAnimation();
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      track.classList.remove('is-settling');
      return;
    }
    track.classList.add('is-settling');
    drag = {id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false};
  });
  track.addEventListener('pointermove', event => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 6) return;
    event.preventDefault();
    drag.moved = true;
    track.setPointerCapture(drag.id);
    track.classList.add('is-dragging');
    track.scrollLeft = drag.left - delta;
  });
  const finishDrag = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (moved) { paint(); goTo(current); }
    else track.classList.remove('is-settling');
  };
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  window.addEventListener('pointerup', finishDrag);
  track.addEventListener('click', event => {
    if (track.dataset.dragged === 'true') { event.preventDefault(); track.dataset.dragged = 'false'; }
  }, true);
  track.addEventListener('pointerup', () => { track.dataset.dragged = String(!!drag?.moved); }, {capture: true});
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('wheel', () => {
    if (drag) return;
    stopAnimation();
    track.classList.remove('is-settling');
  }, {passive: true});
  new ResizeObserver(() => {
    stopAnimation();
    track.classList.remove('is-settling');
    measure();
    track.scrollTo({left: metrics[current].left, behavior: 'instant'});
    schedulePaint();
  }).observe(track);
  motion.addEventListener('change', schedulePaint);
  catalog.classList.add('is-carousel');
  toolbar.hidden = false;
  catalog.querySelector('.catalog-navigation').hidden = false;
  updateCatalog();
}

// Reveal each content group once, without a continuous scroll listener.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = [...document.querySelectorAll(
  '.hero-copy > *, .hero-figure, .location-strip > div, .section-heading, ' +
  '.service-row, .price-note, .work-figure, .gallery-link, .faq-list details, ' +
  '.contact-intro, .contact-item, .reviews-link, .footer-grid'
)];
let revealObserver;
const show = (element) => {
  element.classList.add('is-visible');
  revealObserver?.unobserve(element);
};

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) show(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

  revealTargets.forEach((element) => {
    // Small offsets keep neighboring elements in a readable visual sequence.
    const siblings = [...element.parentElement.children];
    const delay = Math.min(siblings.indexOf(element), 3) * 65;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
}

document.addEventListener('focusin', (event) => {
  const group = event.target.closest('.reveal');
  if (group) show(group);
});

reducedMotion.addEventListener('change', (event) => {
  if (event.matches) {
    revealObserver?.disconnect();
    revealTargets.forEach(show);
  }
});
