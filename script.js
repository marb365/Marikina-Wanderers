(() => {
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
  });

  const slideEls = Array.from(document.querySelectorAll('.hero-slide'));
  const thumbEls = Array.from(document.querySelectorAll('.hero-thumb'));
  const currentEl = document.querySelector('[data-current]');
  const totalEl = document.querySelector('[data-total]');
  const progressFill = document.querySelector('[data-progress-fill]');
  const arrows = document.querySelectorAll('.hero-arrow');
  const hero = document.querySelector('.hero');
  const heroTitle = document.querySelector('[data-hero-title]');
  const heroCopy = document.querySelector('[data-hero-copy]');

  const heroText = [
    ['Marikina City Travel Guide', "From centuries-old heritage houses to the birthplace of the country's shoe industry and a historic clock tower — discover a walkable Marikina with more history than its size suggests."],
  ];

  let index = 0;
  const total = slideEls.length;
  let autoplayTimer = null;

  if (!total) return;
  if (totalEl) totalEl.textContent = total;

  function render() {
    slideEls.forEach((el, i) => el.classList.toggle('is-active', i === index));
    thumbEls.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (currentEl) currentEl.textContent = index + 1;
    if (progressFill) progressFill.style.transform = `scaleX(${(index + 1) / total})`;
    if (heroTitle && heroCopy && heroText[index]) {
      heroTitle.textContent = heroText[index][0];
      heroCopy.textContent = heroText[index][1];
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroVisible = true;

  // Autoplay only runs while the hero is on screen and the tab is active
  function restartAutoplay() {
    clearInterval(autoplayTimer);
    if (reducedMotion || !heroVisible || document.hidden) return;
    autoplayTimer = setInterval(() => goTo(index + 1), 6000);
  }

  function goTo(nextIndex) {
    index = (nextIndex + total) % total;
    render();
    restartAutoplay();
  }

  arrows.forEach((button) => {
    button.addEventListener('click', () => goTo(index + Number(button.dataset.dir || 0)));
  });
  thumbEls.forEach((button, i) => button.addEventListener('click', () => goTo(i)));
  if (hero) {
    hero.tabIndex = 0;
    hero.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
    });
  }

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; restartAutoplay(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', restartAutoplay);
  restartAutoplay();
  render();

  const tabs = Array.from(document.querySelectorAll('.about-tab'));
  const panels = Array.from(document.querySelectorAll('.about-panel'));
  const showAbout = (selectedIndex) => {
    tabs.forEach((tab, i) => {
      const active = i === selectedIndex;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === selectedIndex));
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => showAbout(Number(tab.dataset.aboutIndex))));
  document.querySelectorAll('.explore-card-btn').forEach((button) => {
    button.addEventListener('click', () => {
      showAbout(Number(button.dataset.aboutIndex));
      document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Pop-in on scroll: cards, text, maps (plays once, then stops observing)
  const revealEls = document.querySelectorAll('.reveal-card, .reveal');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }
})();

// ===== Feedback (saved on this device only) =====
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('feedbackForm');
  if (!form) return;
  const list = $('feedbackList'), empty = $('fbEmpty'), starsWrap = $('fbStars');
  const status = $('fbStatus'), ratingText = $('fbRatingText'), summary = $('fbSummary');
  const stars = Array.from(starsWrap.querySelectorAll('.fb-star'));
  const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  const KEY = 'marikinaFeedback';
  let rating = 0, statusTimer;

  const paint = (n, cls) => stars.forEach((s, i) => s.classList.toggle(cls, i < n));
  const setText = (n) => { ratingText.textContent = n ? labels[n - 1] : 'optional'; };
  stars.forEach((s, i) => {
    s.addEventListener('click', () => { rating = i + 1; paint(rating, 'is-active'); setText(rating); });
    s.addEventListener('mouseenter', () => { paint(i + 1, 'is-hover'); setText(i + 1); });
  });
  starsWrap.addEventListener('mouseleave', () => { paint(0, 'is-hover'); setText(rating); });

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} };
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  const initial = (html) => { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent.trim()[0] || '?').toUpperCase(); };
  const starStr = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

  function render() {
    const comments = load();
    list.querySelectorAll('.fb-comment').forEach((el) => el.remove());
    empty.style.display = comments.length ? 'none' : 'block';

    const rated = comments.filter((c) => c.rating > 0);
    summary.hidden = !rated.length;
    if (rated.length) {
      const avg = rated.reduce((a, c) => a + c.rating, 0) / rated.length;
      $('fbAvg').textContent = avg.toFixed(1);
      $('fbAvgStars').textContent = starStr(Math.round(avg));
      $('fbCount').textContent = '(' + comments.length + ')';
    }

    const frag = document.createDocumentFragment();
    comments.map((c, i) => ({ c, i })).reverse().forEach(({ c, i }) => {
      const card = document.createElement('div');
      card.className = 'fb-comment';
      card.innerHTML =
        '<div class="fb-avatar">' + initial(c.name) + '</div>' +
        '<div class="fb-comment-body">' +
          '<div class="fb-comment-head"><span class="fb-comment-name">' + c.name + '</span>' +
          '<span class="fb-comment-date">' + c.date + '</span></div>' +
          (c.rating ? '<div class="fb-comment-stars" aria-label="' + c.rating + ' out of 5 stars">' + starStr(c.rating) + '</div>' : '') +
          '<p class="fb-comment-msg">' + c.message + '</p>' +
          '<button type="button" class="fb-delete" data-i="' + i + '">Delete</button>' +
        '</div>';
      frag.appendChild(card);
    });
    list.appendChild(frag);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('fbName').value.trim(), message = $('fbMessage').value.trim();
    if (!name || !message) return;
    const comments = load();
    comments.push({
      name: esc(name), message: esc(message), rating,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    });
    save(comments);
    form.reset(); rating = 0; paint(0, 'is-active'); paint(0, 'is-hover'); setText(0);
    render();
    status.textContent = 'Thank you! Your feedback has been added.';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 4000);
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.fb-delete');
    if (!btn) return;
    const comments = load();
    comments.splice(Number(btn.dataset.i), 1);
    save(comments);
    render();
  });

  render();
})();

// ===== Home nav bar: sticky nav, section indicator, progress, back-to-top =====
(() => {
  const nav = document.querySelector('.site-nav');
  const bar = document.getElementById('navProgress');
  const toTop = document.getElementById('toTop');
  const menu = document.querySelector('.nav-links');
  const ind = menu && menu.querySelector('.nav-indicator');
  const links = menu ? Array.from(menu.querySelectorAll('a[href^="#"]')) : [];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  let tick = false, current = -2;

  function moveIndicator(i) {
    if (!ind) return;
    if (i < 0) { ind.classList.remove('is-on'); return; }
    const a = links[i];
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    ind.classList.add('is-on');
  }

  function update() {
    tick = false;
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 60);
    if (toTop) toTop.classList.toggle('is-shown', y > 600);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    let cur = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= 140) cur = i; });
    if (cur !== current) {
      current = cur;
      links.forEach((a, i) => a.classList.toggle('is-current', i === cur));
      moveIndicator(cur);
    }
  }
  const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(update); } };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { moveIndicator(current); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(current));
  update();

  if (toTop) toTop.addEventListener('click', goTop);
  links.forEach((a) => {
    if (a.getAttribute('href') === '#top') a.addEventListener('click', (e) => { e.preventDefault(); goTop(); });
  });
})();

// ===== Gallery: tap to expand on touch screens =====
(() => {
  const panels = document.querySelectorAll('.gallery-panel');
  panels.forEach((panel) => {
    panel.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('is-open');
      panels.forEach((p) => p.classList.remove('is-open'));
      if (!wasOpen) panel.classList.add('is-open');
    });
  });
})();