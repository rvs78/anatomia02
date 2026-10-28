import { ATLAS } from './atlas-data.js';
import { LEVELS, QUIZ, SYNONYMS } from './data.js';
import { normalize, matchName, shuffle, applyScore, stars, formatTime } from './logic.js';
import * as fx from './fx.js';

const KEY = 'ap-ra2-vascular-v5';
const PASSWORD = 'alumnesap';
const TEACHER = 'ruben.vallejo@isvh.cat';
const QUIZ_SIZE = 20;
const MAP_PER_SYSTEM = 12;
const MAP_TRIES = 2;
const PHASES = ['Atles', 'Test', 'Mapa mut', 'Informe'];

const app = document.querySelector('#app');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const starRow = (n, cls = 'stars') => `<div class="${cls}" role="img" aria-label="${n} de 3 estrelles">${[0, 1, 2].map(i => `<svg viewBox="0 0 24 24" class="${i < n ? '' : 'no'}"><use href="#i-star"/></svg>`).join('')}</div>`;

/* ---------- Estat ---------- */
const fresh = email => ({
  v: 5, email, phase: 1, start: Date.now(), end: null,
  points: 0, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: { 1: 0, 2: 0, 3: 0 },
  p1: { level: 0, placed: {}, stats: {}, levelStart: Date.now(), bank: {} },
  p2: { order: shuffle(QUIZ.map((_, i) => i)).slice(0, QUIZ_SIZE), perm: {}, i: 0, answers: {} },
  p3: {
    order: [
      ...shuffle(ATLAS.art.targets.map(t => t.id)).slice(0, MAP_PER_SYSTEM),
      ...shuffle(ATLAS.ven.targets.map(t => t.id)).slice(0, MAP_PER_SYSTEM),
    ],
    i: 0, tries: 0, hinted: false, results: {},
  },
  review: { atlas: {}, quiz: [], map: [] },
  seen: {},
});
let s = null;
try { s = JSON.parse(localStorage.getItem(KEY)); if (!s || s.v !== 5) s = null; } catch { s = null; }
if (s) s.seen ||= {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* mode privat */ } };
let cleanup = () => {};

const targetById = id => [...ATLAS.art.targets, ...ATLAS.ven.targets].find(t => t.id === id);
const systemOf = id => id.slice(0, 3);
const levelTargets = lvl => {
  const L = LEVELS[lvl], all = ATLAS[L.system].targets;
  return L.names === 'ALL' ? all : all.filter(t => L.names.includes(t.name));
};

/* ---------- Capçalera ---------- */
function header() {
  $('#steps').innerHTML = s ? PHASES.map((p, i) => {
    const n = i + 1, cur = n === s.phase;
    return `<li ${cur ? 'aria-current="step"' : ''} class="${n < s.phase ? 'done' : ''}">${n < s.phase ? ic('check') : ''}<span>${p}</span></li>`;
  }).join('') : '';
  const on = fx.sound.enabled();
  $('#score').innerHTML = s ? `
    <span class="who">${esc(s.email)}</span>
    <span class="pts">Punts <b id="pts">${s.points}</b></span>
    <span class="streak" title="Encerts seguits. Cada 3, +15 punts">Ratxa <b id="streak">${s.streak}</b></span>
    <button class="iconbtn no-print" id="sound" aria-pressed="${on}" aria-label="${on ? 'Silencia els sons' : 'Activa els sons'}" title="So">${ic(on ? 'sound' : 'mute')}</button>
    <button class="iconbtn no-print" id="logout" aria-label="Surt i esborra el progrés" title="Surt">${ic('exit')}</button>` : `
    <button class="iconbtn no-print" id="sound" aria-pressed="${on}" aria-label="${on ? 'Silencia els sons' : 'Activa els sons'}" title="So">${ic(on ? 'sound' : 'mute')}</button>`;
  $('#sound').onclick = () => { fx.sound.toggle(); header(); };
  const out = $('#logout');
  if (out) out.onclick = () => {
    if (!confirm('Vols sortir? Es perdrà el progrés desat en aquest navegador.')) return;
    localStorage.removeItem(KEY); s = null; render();
  };
}

function score(kind, phase) {
  const before = s.points;
  const r = applyScore(s, kind, phase);
  save(); header();
  if (s.points !== before) { const p = $('#pts'); p?.classList.add('bump'); }
  if (r.bonus) { fx.banner('Ratxa de 3! +15'); fx.sound.play('bonus'); }
  return r;
}

function render() {
  cleanup(); cleanup = () => {};
  document.body.dataset.system = '';
  if (!s) return login();
  header();
  if (s.phase === 1) atlasPhase();
  else if (s.phase === 2) quizPhase();
  else if (s.phase === 3) mapPhase();
  else return report();
  // les fases poden reentrar a render() en canviar de fase: només un sobre alhora
  if (!s.seen[s.phase] && !$('#intro')) intro(s.phase);
}

/* ---------- Sobre d'instruccions ---------- */
const INTROS = {
  1: {
    title: 'Fase 1 <span>Atles</span>',
    lead: 'Cada nivell és una pàgina de l\'àlbum. Omple els forats amb els cromos de cada vas.',
    video: true,
    cards: [
      ['art', 'drag', 'Arrossega', 'Porta cada cromo fins al seu forat o fins al punt negre del vas.'],
      ['ven', 'target', 'O toca i col·loca', 'Toca un cromo i després el forat. Amb teclat: Tab i Enter.'],
      ['foil', 'zoom', 'Amplia la làmina', 'Roda del ratolí o botons + i −. Arrossega el fons per moure-la.'],
    ],
  },
  2: {
    title: 'Fase 2 <span>Test</span>',
    lead: 'Vint preguntes de circulació triades a l\'atzar. Cada resposta porta la seva explicació.',
    cards: [
      ['art', 'keys', 'Respon ràpid', 'Clica una opció o prem les tecles 1, 2, 3 o 4.'],
      ['ven', 'bulb', 'Aprèn de l\'error', 'Després de respondre veuràs la correcta i per què.'],
      ['foil', 'star', 'Ratxa', 'Tres encerts seguits sumen 15 punts extra.'],
    ],
  },
  3: {
    title: 'Fase 3 <span>Mapa mut</span>',
    lead: 'La làmina assenyala un vas. Escriu-ne el nom: és com a l\'examen.',
    cards: [
      ['art', 'pen', 'Escriu el nom', 'Sense «artèria» ni «vena». Accents opcionals; s\'accepten noms en castellà habituals.'],
      ['ven', 'target', 'Dos intents', 'Si falles dues vegades, veuràs la resposta i passarà a la llista de repàs.'],
      ['foil', 'bulb', 'Inicials', 'La pista mostra el començament de cada paraula (−5).'],
    ],
  },
};
function intro(phase) {
  const I = INTROS[phase]; if (!I) return;
  const wrap = document.createElement('div');
  wrap.className = 'intro'; wrap.id = 'intro';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'intro-title');
  wrap.innerHTML = `
    <div class="envelope">
      <div class="flap"></div>
      <div class="inside">
        <h2 id="intro-title">${I.title}</h2>
        <p>${I.lead}</p>
        ${I.video ? `<video src="./assets/tutorial.mp4" poster="./assets/tutorial.jpg" autoplay muted loop playsinline aria-label="Vídeo: com s'enganxa un cromo al seu forat"></video>` : ''}
        <div class="cards">${I.cards.map(([c, i, h, p]) => `<div class="howto ${c}">${ic(i, '')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
        <div class="row">
          <p class="muted" style="color:var(--cover-muted)">Encert +10 · Error −3 · Pista −5</p>
          <button class="btn" id="intro-go">${ic('play')} Comença</button>
        </div>
      </div>
    </div>`;
  document.body.append(wrap);
  const vid = $('video', wrap); if (vid) vid.onerror = () => vid.remove();
  const prev = document.activeElement;
  const close = () => {
    s.seen[phase] = true; save();
    document.removeEventListener('keydown', onKey);
    const done = () => { wrap.remove(); (prev && prev.isConnected ? prev : $('.chip:not(.gone), #term, .choice'))?.focus?.({ preventScroll: true }); };
    if (fx.reduced()) return done();
    wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).finished.then(done, done);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('#intro-go', wrap).onclick = close;
  $('#intro-go', wrap).focus({ preventScroll: true });
  fx.sound.play('open');
  if (fx.reduced()) return;
  const env = $('.envelope', wrap), ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  env.animate([{ transform: 'translateY(40px) scale(.9) rotate(-2deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: ease });
  $('.flap', wrap).animate([{ transform: 'scaleY(5)', filter: 'brightness(1.2)' }, { transform: 'scaleY(1)' }], { duration: 520, delay: 220, easing: ease, fill: 'backwards' });
  $$('.howto', wrap).forEach((c, i) => c.animate(
    [{ transform: `translateY(60px) rotate(${(i - 1) * 9}deg) scale(.85)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 520, delay: 380 + i * 110, easing: ease, fill: 'backwards' }));
}

/* ---------- Entrada ---------- */
function previewPlate() {
  const A = ATLAS.art, show = ['Caròtida comuna', 'Braquial', 'Femoral'];
  const lines = A.targets.filter(t => show.includes(t.name))
    .map(t => `<line x1="${t.slotX}" y1="${t.slotY}" x2="${t.x}" y2="${t.y}"/>`).join('');
  const slots = A.targets.map(t => show.includes(t.name)
    ? `<span class="slot ${t.side} done" style="--sx:${t.slotX}%;top:${t.slotY}%">${esc(t.name)}</span>`
    : `<span class="slot ${t.side}" style="--sx:${t.slotX}%;top:${t.slotY}%"></span>`).join('');
  return `<div class="plate" aria-hidden="true" style="aspect-ratio:${A.w}/${A.h}"><img src="${A.src}" alt="">
    <svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${slots}</div>`;
}

function login() {
  header();
  app.innerHTML = `
  <section class="welcome">
    <div class="intro-col">
      <h1>Vascular <span>Quest</span></h1>
      <p>Omple l'àlbum de les artèries i les venes del RA2, sobre la mateixa làmina de classe.</p>
      <ol>
        <li><span><b>Atles.</b> Enganxa cada cromo al seu forat, en nou pàgines.</span></li>
        <li><span><b>Test.</b> Vint preguntes de circulació, amb explicació.</span></li>
        <li><span><b>Mapa mut.</b> Escriu el nom del vas assenyalat.</span></li>
      </ol>
      <form id="login" novalidate>
        <label class="field">Correu de l'institut<input name="email" type="email" autocomplete="email" placeholder="nom@isvh.cat" required></label>
        <label class="field">Contrasenya de l'aula<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn">${ic('play')} Obre l'àlbum</button>
        <p class="feedback err" id="fb" role="alert"></p>
      </form>
      <p class="note">El progrés es desa en aquest navegador. Si canvies d'ordinador o fas servir una finestra privada, començaràs de nou.</p>
    </div>
    <div class="art">${previewPlate()}<p class="credit">Aplicación de Rubén Vallejo</p></div>
  </section>`;
  $('#login').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get('email')).trim().toLowerCase();
    const fail = m => { $('#fb').innerHTML = ic('x') + `<span>${m}</span>`; fx.shake($('#login')); fx.sound.play('miss'); };
    if (!/^[^@\s]+@isvh\.cat$/.test(email)) return fail('Escriu el teu correu acabat en @isvh.cat.');
    if (f.get('password') !== PASSWORD) return fail('La contrasenya no és correcta. Demana-la al professorat.');
    s = fresh(email); save(); render();
  };
}

/* ---------- Làmina reutilitzable (zoom i desplaçament) ---------- */
function mountPlate(stage, system, inner, pageLabel) {
  const A = ATLAS[system];
  stage.innerHTML = `
    ${pageLabel ? `<div class="pageno">${pageLabel}</div>` : ''}
    <div class="plate" id="plate" style="aspect-ratio:${A.w}/${A.h}">
      <img src="${A.src}" alt="Làmina del sistema ${system === 'art' ? 'arterial' : 'venós'} amb els vasos assenyalats per punts i línies guia" width="${A.w}" height="${A.h}">
      <svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      ${inner}
    </div>
    <div class="zoomer no-print">
      <button type="button" data-z="in" aria-label="Amplia la làmina">${ic('plus')}</button>
      <button type="button" data-z="out" aria-label="Redueix la làmina">${ic('minus')}</button>
      <button type="button" data-z="fit" aria-label="Ajusta la làmina a la pantalla">${ic('fit')}</button>
    </div>`;
  const plate = $('#plate', stage);
  const view = { z: 1, x: 0, y: 0, w: 0, h: 0 };
  function fit() {
    const r = stage.getBoundingClientRect(), pad = 30;
    const h = Math.min(r.height - pad * 2, (r.width - pad * 2) * A.h / A.w);
    view.w = h * A.w / A.h; view.h = h;
    plate.style.width = view.w + 'px'; plate.style.height = view.h + 'px';
    apply();
  }
  function clamp() {
    const r = stage.getBoundingClientRect();
    const mx = Math.max(0, (view.w * view.z - r.width) / 2 + 40), my = Math.max(0, (view.h * view.z - r.height) / 2 + 40);
    view.x = Math.min(mx, Math.max(-mx, view.x)); view.y = Math.min(my, Math.max(-my, view.y));
  }
  function apply() {
    clamp();
    plate.style.transform = `translate(${view.x - view.w * view.z / 2}px, ${view.y - view.h * view.z / 2}px) scale(${view.z})`;
    stage.classList.toggle('zoomed', view.z > 1);
  }
  function zoomTo(z, cx, cy) {
    const r = stage.getBoundingClientRect();
    const nz = Math.min(3, Math.max(1, +z.toFixed(2)));
    const px = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2), py = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
    view.x = px - (px - view.x) * nz / view.z; view.y = py - (py - view.y) * nz / view.z;
    view.z = nz; if (nz === 1) { view.x = 0; view.y = 0; }
    apply();
  }
  stage.querySelector('.zoomer').onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    if (b.dataset.z === 'in') zoomTo(view.z + .5); else if (b.dataset.z === 'out') zoomTo(view.z - .5); else zoomTo(1);
  };
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomTo(view.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
  let pan = null;
  stage.addEventListener('pointerdown', e => {
    if (view.z === 1 || e.target.closest('button, .chip')) return;
    pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; stage.setPointerCapture(e.pointerId); stage.classList.add('panning');
  });
  stage.addEventListener('pointermove', e => { if (!pan) return; view.x = pan.vx + e.clientX - pan.x; view.y = pan.vy + e.clientY - pan.y; apply(); });
  const end = () => { pan = null; stage.classList.remove('panning'); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  const ro = new ResizeObserver(fit); ro.observe(stage);
  fit();
  return {
    plate, svg: $('svg', plate), dispose: () => ro.disconnect(),
    focusOn(t) {
      if (view.z === 1) return;
      view.x = -(t.x / 100 - .5) * view.w * view.z; view.y = -(t.y / 100 - .5) * view.h * view.z; apply();
    },
  };
}

function leader(svg, t, cls) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('x1', t.slotX); el.setAttribute('y1', t.slotY); el.setAttribute('x2', t.x); el.setAttribute('y2', t.y);
  el.setAttribute('class', cls); el.dataset.for = t.id;
  svg.append(el);
  return el;
}

/** Si el punter és sobre un punt de vas, tria el punt actiu més proper (els punts propers se solapen). */
function nearestTarget(el, x, y) {
  const hit = el?.closest('[data-target]');
  if (!hit || !hit.classList.contains('dot')) return hit;
  let best = hit, bd = Infinity;
  $$('.dot[data-target]:not(.off)').forEach(d => {
    const r = d.getBoundingClientRect(), dd = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
    if (dd < bd) { bd = dd; best = d; }
  });
  return best;
}

function sayIn(fb) {
  const icons = { ok: 'check', err: 'x', info: 'bulb' };
  return (msg, kind) => { fb.innerHTML = `${ic(icons[kind] || 'bulb')}<span>${esc(msg)}</span>`; fb.className = 'feedback ' + kind; };
}

/* ---------- Fase 1 · Atles ---------- */
function atlasPhase() {
  const lvl = s.p1.level;
  if (lvl >= LEVELS.length) { s.phase = 2; save(); return render(); }
  const L = LEVELS[lvl], A = ATLAS[L.system], active = levelTargets(lvl);
  const activeIds = new Set(active.map(t => t.id));
  const placed = s.p1.placed[lvl] ||= {};
  const stat = s.p1.stats[lvl] ||= { errors: 0, hints: 0, ms: 0 };
  if (!s.p1.bank[lvl]) { s.p1.bank[lvl] = shuffle(active.map(t => t.name)); s.p1.levelStart = Date.now(); save(); }
  document.body.dataset.system = L.system;
  const sysName = L.system === 'art' ? 'Artèries' : 'Venes';

  const slots = A.targets.map(t => {
    const on = activeIds.has(t.id), done = placed[t.id];
    return `<button type="button" class="slot ${t.side} ${on ? '' : 'off'} ${done ? 'done' : ''}" style="--sx:${t.slotX}%;top:${t.slotY}%"
      data-target="${t.id}" ${on ? '' : 'tabindex="-1" aria-hidden="true"'} aria-label="${done ? esc(t.name) : 'Forat buit'}">${done ? esc(t.name) : ''}</button>
      <button type="button" class="dot ${on ? '' : 'off'} ${done ? 'done' : ''}" style="left:${t.x}%;top:${t.y}%" data-target="${t.id}" tabindex="-1" aria-hidden="true"></button>`;
  }).join('');

  app.innerHTML = `
  <section class="play">
    <div class="stage" id="stage"></div>
    <aside class="panel">
      <header>
        <h1>${esc(L.title)}</h1>
        <div class="meta"><span class="sysbadge">${sysName}</span><span>${L.boss ? 'Pàgina completa, sense ajudes de regió' : 'Els forats grisos són d\'altres pàgines'}</span></div>
      </header>
      <div class="progress">
        <div class="row"><span><b id="count"></b> enganxats</span><span id="clock"></span></div>
        <div class="bar"><span id="bar"></span></div>
      </div>
      <div id="work">
        <p class="muted" style="margin-bottom:12px">Arrossega cada cromo fins al seu forat, o toca'l i després toca el forat.</p>
        <div class="pile" id="bank" role="list" aria-label="Cromos per enganxar"></div>
      </div>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row tools" id="tools">
        <button type="button" class="btn ghost small" id="hint">${ic('bulb')} Pista −5</button>
      </div>
    </aside>
  </section>`;

  const stage = $('#stage');
  const P = mountPlate(stage, L.system, slots, `Pàgina <span>${lvl + 1}</span> / ${LEVELS.length}`);
  let timer = 0;
  cleanup = () => { P.dispose(); clearInterval(timer); };
  active.filter(t => placed[t.id]).forEach(t => leader(P.svg, t, ''));

  const bank = $('#bank');
  bank.innerHTML = s.p1.bank[lvl].map(n => `<button type="button" class="chip ${active.some(t => t.name === n && placed[t.id]) ? 'gone' : ''}" role="listitem" aria-pressed="false" data-name="${esc(n)}">${esc(n)}</button>`).join('');
  const say = sayIn($('#fb'));
  let selected = null, busy = false;
  const elapsed = () => stat.ms + (Date.now() - s.p1.levelStart);
  timer = setInterval(() => { $('#clock').textContent = formatTime(elapsed()); }, 1000);

  function progress() {
    const n = active.filter(t => placed[t.id]).length;
    $('#count').textContent = `${n} de ${active.length}`;
    $('#bar').style.width = (100 * n / active.length) + '%';
    $('#clock').textContent = formatTime(elapsed());
    if (n === active.length) finishLevel();
  }
  function select(chip) {
    $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', String(c === chip && c.getAttribute('aria-pressed') !== 'true')));
    selected = chip && chip.getAttribute('aria-pressed') === 'true' ? chip.dataset.name : null;
    $$('.dot.ping, .slot.ask').forEach(e => e.classList.remove('ping', 'ask'));
  }
  async function attempt(name, id, from) {
    if (busy || !name || !activeIds.has(id) || placed[id]) return;
    const t = targetById(id), slot = $(`.slot[data-target="${id}"]`), chip = $(`.chip[data-name="${CSS.escape(name)}"]`, bank);
    $$('line.hint', P.svg).forEach(l => l.remove());
    $$('.ping, .ask').forEach(e => e.classList.remove('ping', 'ask'));
    busy = true;
    if (t.name === name) {
      placed[id] = true;
      const r = score('hit', 1);
      save();
      selected = null;
      chip?.classList.add('lifting');
      await fx.fly(from || chip, slot, name, L.system);
      chip?.classList.add('gone'); chip?.classList.remove('lifting');
      $$(`[data-target="${id}"]`).forEach(e => e.classList.add('done'));
      slot.textContent = name; slot.setAttribute('aria-label', name);
      leader(P.svg, t, 'draw');
      fx.stick(slot);
      fx.burst(slot, '+' + r.gained);
      if (!r.bonus) fx.sound.play('hit');
      say(r.bonus ? `${name}! Tres seguits: +${r.gained} punts.` : `${name}, enganxat. +10 punts.`, 'ok');
      busy = false;
      progress();
      $('.chip:not(.gone)', bank)?.focus({ preventScroll: true });
    } else {
      stat.errors++;
      score('miss', 1);
      (s.review.atlas[name] ||= 0); s.review.atlas[name]++;
      save();
      $$(`[data-target="${id}"]`).forEach(fx.shake);
      fx.sound.play('miss');
      fx.burst(slot, '−3', 'loss');
      say(`${name} no va en aquest forat. −3 punts.`, 'err');
      chip?.classList.add('lifting');
      await fx.bounceBack(from || slot, chip || bank, name, L.system);
      chip?.classList.remove('lifting');
      busy = false;
    }
  }

  // Arrossegar amb punter (ratolí, trackpad i pantalla tàctil)
  let drag = null;
  bank.addEventListener('pointerdown', e => {
    const chip = e.target.closest('.chip'); if (!chip || e.button > 0 || busy) return;
    drag = { chip, x: e.clientX, y: e.clientY, moving: false, ghost: null, over: null };
    chip.setPointerCapture(e.pointerId);
  });
  bank.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moving && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.moving = true;
      drag.ghost = Object.assign(document.createElement('div'), { className: 'ghost-chip', textContent: drag.chip.dataset.name });
      document.body.append(drag.ghost);
      drag.chip.classList.add('lifting');
    }
    if (!drag.moving) return;
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    const over = nearestTarget(document.elementFromPoint(e.clientX, e.clientY), e.clientX, e.clientY);
    if (drag.over && drag.over !== over) $$(`[data-target="${drag.over.dataset.target}"]`).forEach(x => x.classList.remove('drop'));
    if (over && activeIds.has(over.dataset.target)) $$(`[data-target="${over.dataset.target}"]`).forEach(x => x.classList.add('drop'));
    drag.over = over;
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    d.ghost?.remove();
    d.chip.classList.remove('lifting');
    $$('.drop').forEach(x => x.classList.remove('drop'));
    if (!d.moving) return select(d.chip);
    const over = e.type === 'pointerup' ? nearestTarget(document.elementFromPoint(e.clientX, e.clientY), e.clientX, e.clientY) : null;
    if (over) attempt(d.chip.dataset.name, over.dataset.target, { x: e.clientX, y: e.clientY });
  };
  bank.addEventListener('pointerup', endDrag);
  bank.addEventListener('pointercancel', endDrag);
  bank.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e.target.closest('.chip')); } });
  stage.addEventListener('click', e => {
    const t = nearestTarget(e.target, e.clientX, e.clientY); if (!t) return;
    if (!selected) { fx.sound.play('hint'); return say('Primer tria un cromo del munt.', 'info'); }
    attempt(selected, t.dataset.target);
  });

  $('#hint').onclick = () => {
    if (!selected) return say('Tria primer un cromo i la pista et mostrarà on va.', 'info');
    const t = active.find(x => x.name === selected);
    stat.hints++; score('hint', 1); save();
    fx.sound.play('hint');
    $$(`[data-target="${t.id}"]`).forEach(e => e.classList.add(e.classList.contains('dot') ? 'ping' : 'ask'));
    leader(P.svg, t, 'hint');
    P.focusOn(t);
    say(`Pista: el forat de ${selected} brilla en daurat. −5 punts.`, 'info');
  };

  function finishLevel() {
    const first = !stat.done;
    if (first) { stat.ms = elapsed(); stat.stars = stars(stat.errors, stat.hints); stat.done = true; save(); }
    clearInterval(timer);
    const st = stat.stars;
    $('#work').innerHTML = `
      <div class="done-card">
        <h2>Pàgina completa</h2>
        ${starRow(st)}
        <div class="stats">
          <div><span>Temps</span><b>${formatTime(stat.ms).replace(' min ', ':').replace(' s', '')}</b></div>
          <div><span>Errors</span><b>${stat.errors}</b></div>
          <div><span>Pistes</span><b>${stat.hints}</b></div>
        </div>
        <button class="btn sys" id="next">${lvl + 1 < LEVELS.length ? 'Passa la pàgina' : 'Comença el test'}</button>
      </div>`;
    $('#tools').hidden = true;
    if (first) {
      fx.sound.play('level');
      $$('.done-card .stars svg').forEach((el, i) => fx.stamp(el, 250 + i * 260));
    }
    $('#next').onclick = () => { s.p1.level++; s.p1.levelStart = Date.now(); save(); render(); };
    $('#next').focus();
  }
  progress();
}

/* ---------- Fase 2 · Test ---------- */
function quizPhase() {
  const p = s.p2;
  if (p.i >= p.order.length) { s.phase = 3; save(); return render(); }
  const qi = p.order[p.i], [q, opts, right, why] = QUIZ[qi];
  const perm = p.perm[qi] ||= shuffle([0, 1, 2, 3]);
  const answered = p.answers[qi];
  app.innerHTML = `
  <div class="quizwrap"><section class="quiz">
    <div class="qcard">
      <div class="qhead"><span class="num">${p.i + 1} <span>/ ${p.order.length}</span></span><span class="muted">Tecles 1–4 per respondre</span></div>
      <div class="bar"><span style="width:${100 * p.i / p.order.length}%"></span></div>
      <h2>${esc(q)}</h2>
      <div class="choices" role="group" aria-label="Opcions">
        ${perm.map((o, k) => `<button type="button" class="choice" data-o="${o}"><kbd>${k + 1}</kbd><span>${esc(opts[o])}</span>${ic(o === right ? 'check' : 'x')}</button>`).join('')}
      </div>
      <div id="after"></div>
    </div>
  </section></div>`;
  const show = (picked, animate) => {
    $$('.choice').forEach(b => {
      b.disabled = true;
      const o = +b.dataset.o;
      if (o === right) b.classList.add('right');
      if (o === picked) b.classList.add('picked');
    });
    const ok = picked === right;
    $('#after').innerHTML = `
      <div class="explain"><b>${ok ? 'Correcte!' : 'No és aquesta.'}</b><span>${ok ? '' : 'La bona és la marcada en verd. '}${esc(why)}</span></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="next">${p.i + 1 < p.order.length ? 'Següent pregunta' : 'Comença el mapa mut'}</button></div>`;
    $('#next').onclick = () => { p.i++; save(); render(); };
    $('#next').focus();
    if (animate && !fx.reduced()) $('.explain').animate([{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  };
  if (answered != null) show(answered, false);
  const choose = o => {
    if (p.answers[qi] != null) return;
    p.answers[qi] = o;
    const ok = o === right, btn = $(`.choice[data-o="${o}"]`);
    const r = score(ok ? 'hit' : 'miss', 2);
    if (!ok) s.review.quiz.push(qi);
    save(); show(o, true);
    if (ok) { fx.stick(btn); fx.burst(btn, '+' + r.gained); if (!r.bonus) fx.sound.play('hit'); }
    else { fx.shake(btn); fx.burst(btn, '−3', 'loss'); fx.sound.play('miss'); }
  };
  $('.choices').onclick = e => { const b = e.target.closest('.choice'); if (b) choose(+b.dataset.o); };
  const onKey = e => { const n = +e.key; if (n >= 1 && n <= 4 && !e.target.closest('input') && !$('#intro')) choose(perm[n - 1]); };
  document.addEventListener('keydown', onKey);
  cleanup = () => document.removeEventListener('keydown', onKey);
}

/* ---------- Fase 3 · Mapa mut ---------- */
function mapPhase() {
  const p = s.p3;
  if (p.i >= p.order.length) { s.phase = 4; s.end = Date.now(); save(); return render(); }
  const id = p.order[p.i], t = targetById(id), sys = systemOf(id), A = ATLAS[sys];
  document.body.dataset.system = sys;
  const dots = A.targets.map(x => `<span class="dot ${x.id === id ? 'now' : 'off'}" style="left:${x.x}%;top:${x.y}%"></span>`).join('');
  const slot = `<span class="slot ${t.side} ask" style="--sx:${t.slotX}%;top:${t.slotY}%">?</span>`;
  app.innerHTML = `
  <section class="play">
    <div class="stage" id="stage"></div>
    <aside class="panel">
      <header>
        <h1>Quin vas és?</h1>
        <div class="meta"><span class="sysbadge">${sys === 'art' ? 'Artèria' : 'Vena'}</span><span>${p.i + 1} de ${p.order.length}</span></div>
      </header>
      <div class="bar"><span style="width:${100 * p.i / p.order.length}%"></span></div>
      <form class="answer" id="ans" autocomplete="off">
        <label class="field" for="term">Nom del vas assenyalat</label>
        <input id="term" name="term" spellcheck="false" autocapitalize="off" placeholder="Per exemple: femoral">
        <div class="row"><button class="btn sys">${ic('check')} Comprova</button><button type="button" class="btn ghost small" id="hint">${ic('bulb')} Inicials −5</button></div>
      </form>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <p class="muted tools">Tens ${MAP_TRIES} intents per vas. Després veuràs la resposta i continuaràs.</p>
    </aside>
  </section>`;
  const P = mountPlate($('#stage'), sys, dots + slot, `Mapa mut <span>${p.i + 1}</span> / ${p.order.length}`);
  leader(P.svg, t, 'hint');
  let timer = 0;
  cleanup = () => { P.dispose(); clearTimeout(timer); };
  const input = $('#term');
  if (s.seen[3]) input.focus();
  const say = sayIn($('#fb'));
  const next = ms => { timer = setTimeout(() => { p.i++; p.tries = 0; p.hinted = false; save(); render(); }, ms); };
  let locked = false;
  $('#ans').onsubmit = e => {
    e.preventDefault(); if (locked) return;
    const val = input.value; if (!normalize(val)) return say('Escriu un nom abans de comprovar.', 'info');
    const m = matchName(val, t.name, SYNONYMS), box = $('.slot.ask');
    if (m) {
      locked = true; p.results[id] = p.tries ? 'retry' : 'ok';
      const r = score('hit', 3);
      box.textContent = t.name; box.className = `slot ${t.side} done`;
      fx.stick(box); fx.burst(box, '+' + r.gained);
      if (!r.bonus) fx.sound.play('hit');
      say(m === 'typo' ? `${t.name}! Revisa l'ortografia.` : `${t.name}!${r.bonus ? ' Tres seguits, +15.' : ''}`, 'ok');
      save(); return next(1000);
    }
    p.tries++; score('miss', 3);
    fx.shake(input); fx.shake(box); fx.sound.play('miss'); fx.burst(box, '−3', 'loss');
    if (p.tries >= MAP_TRIES) {
      locked = true; p.results[id] = 'miss'; s.review.map.push(id); save();
      box.textContent = t.name;
      say(`Era ${t.name}. L'afegim a la llista de repàs.`, 'err');
      return next(2200);
    }
    save(); say('No és aquest. Torna-ho a provar.', 'err'); input.select();
  };
  $('#hint').onclick = () => {
    if (p.hinted || locked) return;
    p.hinted = true; score('hint', 3); save(); fx.sound.play('hint');
    const shown = t.name.split(' ').map(w => w.slice(0, Math.max(2, Math.ceil(w.length / 3))) + '…').join(' ');
    say(`Comença per: ${shown}`, 'info'); input.focus();
  };
}

/* ---------- Informe ---------- */
function report() {
  document.body.dataset.system = '';
  const quizOk = s.p2.order.filter(qi => s.p2.answers[qi] === QUIZ[qi][2]).length;
  const mapOk = Object.values(s.p3.results).filter(r => r !== 'miss').length;
  const totalMs = (s.end || Date.now()) - s.start;
  const rows = LEVELS.map((L, i) => {
    const st = s.p1.stats[i] || {};
    return `<tr><td>${i + 1}. ${esc(L.title)} <span class="muted">(${L.system === 'art' ? 'artèries' : 'venes'})</span></td>
      <td class="num">${st.stars ? starRow(st.stars, 'mini') : '—'}</td><td class="num">${st.errors ?? 0}</td><td class="num">${st.hints ?? 0}</td><td class="num">${st.ms ? formatTime(st.ms) : '—'}</td></tr>`;
  }).join('');
  const atlasMiss = Object.entries(s.review.atlas).sort((a, b) => b[1] - a[1]);
  const mapMiss = s.review.map.map(targetById);
  const quizMiss = s.review.quiz.map(qi => QUIZ[qi]);
  app.innerHTML = `
  <div class="reportwrap"><section class="report" id="report">
    <div class="sheet">
      <header style="display:grid;gap:8px">
        <h1>Àlbum completat</h1>
        <p><b>${esc(s.email)}</b>, ${new Date(s.end || Date.now()).toLocaleString('ca-ES')}. Temps total: ${formatTime(totalMs)}.</p>
      </header>
      <div class="tiles">
        <div class="tile big"><span>Punts</span><b>${s.points}</b></div>
        <div class="tile"><span>Atles</span><b>${s.phasePts[1]}</b></div>
        <div class="tile"><span>Test</span><b>${quizOk}/${s.p2.order.length}</b></div>
        <div class="tile"><span>Mapa mut</span><b>${mapOk}/${s.p3.order.length}</b></div>
        <div class="tile"><span>Errors</span><b>${s.errors}</b></div>
        <div class="tile"><span>Pistes</span><b>${s.hints}</b></div>
      </div>
      <div>
        <h2 style="margin-bottom:8px">Pàgines de l'atles</h2>
        <table><thead><tr><th>Pàgina</th><th class="num">Estrelles</th><th class="num">Errors</th><th class="num">Pistes</th><th class="num">Temps</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div style="display:grid;gap:10px">
        <h2>Per repassar</h2>
        ${atlasMiss.length ? `<p class="muted">Cromos col·locats en un forat equivocat (vegades):</p><div class="tags">${atlasMiss.map(([n, c]) => `<span class="tag">${esc(n)} × ${c}</span>`).join('')}</div>` : ''}
        ${mapMiss.length ? `<p class="muted">Vasos no reconeguts al mapa mut:</p><div class="tags">${mapMiss.map(t => `<span class="tag ${systemOf(t.id)}">${esc(t.name)}</span>`).join('')}</div>` : ''}
        ${quizMiss.length ? `<p class="muted">Preguntes del test fallades i la seva resposta:</p><ul>${quizMiss.map(q => `<li>${esc(q[0])} <b>${esc(q[1][q[2]])}</b></li>`).join('')}</ul>` : ''}
        ${!atlasMiss.length && !mapMiss.length && !quizMiss.length ? '<p>Cap error en tot el recorregut.</p>' : ''}
      </div>
      <div class="no-print" style="display:grid;gap:10px">
        <div class="row"><button class="btn" id="pdf">${ic('pdf')} Desa l'informe en PDF</button><button class="btn ghost" id="mail" style="color:var(--ink)">${ic('mail')} Obre un correu al professor</button></div>
        <p class="muted">Al diàleg d'impressió tria «Desa com a PDF». El correu s'obre amb el resum, però el PDF l'has d'adjuntar tu abans d'enviar-lo.</p>
      </div>
    </div>
  </section></div>`;
  if (!s.seen[4]) {
    s.seen[4] = true; save();
    fx.sound.play('level');
    $$('.tile').forEach((el, i) => fx.stamp(el, 120 + i * 90));
  }
  $('#pdf').onclick = () => window.print();
  $('#mail').onclick = () => {
    const body = `Informe de Vascular Quest · RA2\nAlumne: ${s.email}\nPunts: ${s.points}\nTest: ${quizOk}/${s.p2.order.length}\nMapa mut: ${mapOk}/${s.p3.order.length}\nErrors: ${s.errors} · Pistes: ${s.hints}\nTemps: ${formatTime(totalMs)}\n\nAdjunto l'informe en PDF.`;
    location.href = `mailto:${TEACHER}?subject=${encodeURIComponent('AP RA2 · Vascular Quest · ' + s.email)}&body=${encodeURIComponent(body)}`;
  };
}

render();
