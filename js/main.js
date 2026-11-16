(function () {
  var body = document.body;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');

  // Sticky header shadow
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () { body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) { body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }

  // Dropdown (keyboard / touch)
  document.querySelectorAll('.nav .dd > button').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = btn.parentElement;
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.nav .dd.open').forEach(function (dd) { dd.classList.remove('open'); dd.querySelector('button').setAttribute('aria-expanded', 'false'); });
  });

  window.__fx = true;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ομαλή εμφάνιση στοιχείων κατά το scroll
  var SEL = '.hero-label,.hero-title,.hero .lead,.hero-actions,.hero-facts,.hero-card,' +
    '.page-hero .breadcrumbs,.page-hero h1,.page-hero .lead,.page-hero .hero-actions,' +
    '.trust-item,.section-title,.section-head > .lead,.service-card,.split .photo,.split p,.split .quote,' +
    '.check-list li,.step,.areas,.map,.faq details,.cta-band,.value,.feature,.contact-card,.side-card,' +
    '.gallery .photo,.office,.timeline li,.prose > h2,.prose > p,.prose .photo,.note,.guide-tabs';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!reduce && 'IntersectionObserver' in window) {
    els.forEach(function (el) {
      el.classList.add('rv');
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return els.indexOf(c) > -1; });
      var i = Math.min(sibs.indexOf(el), 6);
      if (el.closest('.hero')) i = els.filter(function (e) { return e.closest('.hero'); }).indexOf(el);
      el.style.setProperty('--d', (i * 80) + 'ms');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  }

  // Διακριτική 3D κλίση στις κάρτες (μόνο με ποντίκι)
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.hero-card, .service-card, .contact-card, .value').forEach(function (el) {
      var max = el.classList.contains('hero-card') ? 5 : 3;
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg) translateY(-2px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // Μέτρηση χρόνων εμπειρίας
  var num = document.querySelector('.hero-facts strong');
  if (num && !reduce && /^\d+\+$/.test(num.textContent)) {
    var target = parseInt(num.textContent, 10), start = null;
    num.textContent = '0+';
    var step = function (ts) {
      if (!start) start = ts + 400;
      var k = Math.max(0, Math.min((ts - start) / 1400, 1));
      num.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + '+';
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Photo slots: hide motif once a real image is present
  document.querySelectorAll('.photo img').forEach(function (img) {
    var mark = function () { img.closest('.photo').classList.add('has-img'); };
    if (img.complete && img.naturalWidth) mark(); else img.addEventListener('load', mark);
  });

  // Guide tabs (Τι κάνω τώρα)
  var tabs = document.querySelectorAll('.guide-tabs [role="tab"]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var sel = t === tab;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
      });
    });
  });

  // Εναλλαγή χάρτη γραφείων (Αργυρούπολη / Γλυφάδα)
  document.querySelectorAll('.map-box').forEach(function (box) {
    var frame = box.querySelector('iframe');
    var btns = box.querySelectorAll('.map-switch button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-selected', o === b ? 'true' : 'false'); });
        if (frame.getAttribute('src') !== b.dataset.src) frame.setAttribute('src', b.dataset.src);
      });
    });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
