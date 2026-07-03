/* ─── Nav toggle ──────────────────────────────────────────── */
const burger = document.getElementById('nav-burger');
const mobileNav = document.getElementById('nav-mobile');
burger.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
function closeNav() {
  mobileNav.classList.remove('open');
  burger.setAttribute('aria-expanded', false);
}
// Any link or button tapped inside the drawer closes it.
mobileNav.addEventListener('click', e => {
  if (e.target.closest('a,button')) closeNav();
});

/* ─── Scroll progress + nav shrink ────────────────────────── */
const navEl = document.querySelector('.nav');
const progressEl = document.getElementById('scroll-progress');
let scrollTicking = false;
function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressEl.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  navEl.classList.toggle('scrolled', scrollTop > 40);
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { requestAnimationFrame(onScroll); scrollTicking = true; }
}, { passive: true });
onScroll();

/* ─── Dialogs (native <dialog>: free focus trap + Escape) ──── */
function openDialog(id) {
  const d = document.getElementById('modal-' + id);
  if (!d) return;
  d.showModal();
  const first = d.querySelector('input:not([type=hidden]):not([name=bot-field]),select,textarea');
  if (first) setTimeout(() => first.focus(), 120);
}
function closeDialog(id) {
  document.getElementById('modal-' + id)?.close();
}
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open-dialog]');
  if (opener) { openDialog(opener.dataset.openDialog); return; }
  const closer = e.target.closest('[data-close-dialog]');
  if (closer) closeDialog(closer.dataset.closeDialog);
});
// Light-dismiss: click on the backdrop (the dialog element itself) closes it.
document.querySelectorAll('.modal-dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
});

/* ─── Forms → Netlify submission + confirmation dialog ────── */
const FORMS = {
  'contact-form':     { dialog: null,          title: 'Message Sent',         msg: 'We have your details and your goal. Expect a reply within one business day.' },
  'booking-form':     { dialog: 'booking',     title: 'Session Booked',       msg: 'Your free intake session is reserved. Check your email for confirmation and what to bring.' },
  'application-form': { dialog: 'application', title: 'Application Received', msg: 'Your lifter profile is in. We review every application and reply within 48 hours.' },
};

function showConfirm(title, msg) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  openDialog('confirm');
}

Object.entries(FORMS).forEach(([id, cfg]) => {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = form.querySelector('[type=submit]');
    if (btn) btn.disabled = true;
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (cfg.dialog) closeDialog(cfg.dialog);
        form.reset();
        showConfirm(cfg.title, cfg.msg);
      })
      .catch(() => {
        if (cfg.dialog) closeDialog(cfg.dialog);
        showConfirm('Something Went Wrong', 'Your message didn\'t go through. Call us at (513) 720-9981 or try again in a minute.');
      })
      .finally(() => { if (btn) btn.disabled = false; });
  });
});

/* ─── Scroll reveals ──────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal, .reveal-clip').forEach(el => revealObserver.observe(el));

/* ─── Count-up animation ──────────────────────────────────── */
function countUp(el, target, duration, suffix) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + (suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    if (!isNaN(target)) {
      countUp(el, target, 1400);
      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count], .pr-counter').forEach(el => {
  if (el.classList.contains('pr-counter')) {
    el.dataset.target = el.dataset.target || el.textContent.trim();
  }
  countObserver.observe(el);
});

/* ─── PR Calculator ───────────────────────────────────────── */
const PCT_PROTOCOLS = [
  { pct: 45, label: 'Light Dynamic',     purpose: '~3x5 @ 45% - GPP Speed' },
  { pct: 50, label: 'Speed (Bands)',      purpose: '9x3 @ 50% - Dynamic Effort primary' },
  { pct: 55, label: 'Speed (Chains)',     purpose: '8x3 @ 55% - Transition load' },
  { pct: 60, label: 'Dynamic Effort',     purpose: '12x2 @ 60% - Classic DE protocol' },
  { pct: 65, label: 'Submaximal',         purpose: '5x2 @ 65% - Heavy dynamic' },
  { pct: 70, label: 'Near Maximal',       purpose: '3x1 @ 70% - Bridge to ME work' },
  { pct: 75, label: 'Heavy Single',       purpose: '1x1 @ 75% - Max effort threshold' },
  { pct: 80, label: 'Max Effort Range',   purpose: '1x1 @ 80% - Competition prep' },
  { pct: 90, label: 'Competition Attempt',purpose: '1x1 @ 90% - Peak single' },
];

function calcRM(weight, reps) {
  if (reps < 1) return { epley: weight, brzycki: weight };
  const epley = weight * (1 + reps / 30);
  const brzycki = reps === 1 ? weight : weight * (36 / (37 - Math.min(reps, 36)));
  return { epley: Math.round(epley), brzycki: Math.round(brzycki) };
}

function updateCalc() {
  const weight = parseFloat(document.getElementById('calc-weight').value) || 0;
  const reps   = parseInt(document.getElementById('calc-reps').value, 10) || 1;
  const { epley, brzycki } = calcRM(weight, reps);

  document.getElementById('calc-epley').innerHTML   = epley   + '<span class="calc-rm-unit">lb</span>';
  document.getElementById('calc-brzycki').innerHTML = brzycki + '<span class="calc-rm-unit">lb</span>';

  const rm = epley;
  const table = document.getElementById('pct-table');
  const rows = PCT_PROTOCOLS.map(p => {
    const load = Math.round(rm * p.pct / 100);
    return `<div class="pct-row">
      <div class="pct-val">${p.pct}%</div>
      <div class="pct-load">${load}lb</div>
      <div>
        <div class="pct-protocol">${p.label}</div>
        <div class="pct-purpose">${p.purpose}</div>
      </div>
    </div>`;
  }).join('');

  // Keep the header, replace only rows
  const header = table.querySelector('.pct-table-head');
  table.innerHTML = '';
  table.appendChild(header);
  table.insertAdjacentHTML('beforeend', rows);
}

['calc-lift', 'calc-weight', 'calc-reps'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('change', updateCalc);
  el.addEventListener('input', updateCalc);
});
updateCalc();

/* ─── Reduced motion ──────────────────────────────────────── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.reveal, .reveal-clip').forEach(el => {
    el.style.transition = 'none';
    el.classList.add('visible');
  });
  document.querySelectorAll('[style*="animation"]').forEach(el => {
    el.style.animation = 'none';
  });
}
