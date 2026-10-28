import { ATLAS } from './atlas-data.js';
import { LEVELS, QUIZ, SYNONYMS } from './data.js';
import { normalize, matchName, shuffle, applyScore, stars, formatTime } from './logic.js';

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
});
let s = null;
try { s = JSON.parse(localStorage.getItem(KEY)); if (!s || s.v !== 5) s = null; } catch { s = null; }
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
    return `<li ${cur ? 'aria-current="step"' : ''} class="${n < s.phase ? 'done' : ''}">${n < s.phase ? '✓ ' : ''}${p}</li>`;
  }).join('') : '';
  $('#score').innerHTML = s ? `
    <span class="who">${esc(s.email)}</span>
    <span>Punts <b>${s.points}</b></span>
    <span class="streak" title="Encerts seguits. Cada 3, +15 punts">Ratxa <b>${s.streak}</b></span>
    <button class="linkish no-print" id="logout">Surt</button>` : '';
  const out = $('#logout');
  if (out) out.onclick = () => {
    if (!confirm('Vols sortir? Es perdrà el progrés desat en aquest navegador.')) return;
    localStorage.removeItem(KEY); s = null; render();
  };
}

function score(kind, phase) {
  const r = applyScore(s, kind, phase);
  save(); header();
  return r;
}

function render() {
  cleanup(); cleanup = () => {};
  document.body.dataset.system = '';
  if (!s) return login();
  header();
  if (s.phase === 1) return atlasPhase();
  if (s.phase === 2) return quizPhase();
  if (s.phase === 3) return mapPhase();
  return report();
}

/* ---------- Entrada ---------- */
function previewPlate() {
  const A = ATLAS.art, show = ['Caròtida comuna', 'Braquial', 'Femoral'];
  const lines = A.targets.filter(t => show.includes(t.name))
    .map(t => `<line x1="${t.slotX}" y1="${t.slotY}" x2="${t.x}" y2="${t.y}"/>`).join('');
  const slots = A.targets.map(t => show.includes(t.name)
    ? `<span class="slot ${t.side} done" style="--sx:${t.slotX}%;top:${t.slotY}%">${esc(t.name)}</span>`
    : `<span class="slot ${t.side}" style="--sx:${t.slotX}%;top:${t.slotY}%"></span>`).join('');
  return `<div class="plate" style="aspect-ratio:${A.w}/${A.h}"><img src="${A.src}" alt="">
    <svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${slots}</div>`;
}

function login() {
  header();
  app.innerHTML = `
  <section class="welcome">
    <div class="intro">
      <h1>Vascular Quest</h1>
      <p>Identifica les artèries i les venes principals sobre l'atles del RA2, tal com a la làmina de classe.</p>
      <ol>
        <li><b>Atles</b>: col·loca cada nom a la seva casella. Nou nivells.</li>
        <li><b>Test</b>: vint preguntes de circulació, amb explicació.</li>
        <li><b>Mapa mut</b>: escriu el nom del vas assenyalat.</li>
      </ol>
      <form id="login" novalidate>
        <label class="field">Correu de l'institut<input name="email" type="email" autocomplete="email" placeholder="nom@isvh.cat" required></label>
        <label class="field">Contrasenya de l'aula<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn">Comença</button>
        <p class="feedback err" id="fb" role="alert"></p>
      </form>
      <p class="muted">El progrés es desa en aquest navegador. Si canvies d'ordinador o fas servir una finestra privada, començaràs de nou.</p>
    </div>
    <div class="art" aria-hidden="true">${previewPlate()}</div>
  </section>`;
  $('#login').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get('email')).trim().toLowerCase();
    if (!/^[^@\s]+@isvh\.cat$/.test(email)) return void ($('#fb').textContent = 'Escriu el teu correu acabat en @isvh.cat.');
    if (f.get('password') !== PASSWORD) return void ($('#fb').textContent = 'La contrasenya no és correcta. Demana-la al professorat.');
    s = fresh(email); save(); render();
  };
}

/* ---------- Làmina reutilitzable (zoom i desplaçament) ---------- */
function mountPlate(stage, system, inner) {
  const A = ATLAS[system];
  stage.innerHTML = `
    <div class="plate" id="plate" style="aspect-ratio:${A.w}/${A.h}">
      <img src="${A.src}" alt="Làmina del sistema ${system === 'art' ? 'arterial' : 'venós'} amb els vasos assenyalats per punts i línies guia" width="${A.w}" height="${A.h}">
      <svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      ${inner}
    </div>
    <div class="zoomer no-print">
      <button type="button" data-z="in" aria-label="Amplia la làmina">+</button>
      <button type="button" data-z="out" aria-label="Redueix la làmina">−</button>
      <button type="button" data-z="fit" aria-label="Ajusta la làmina a la pantalla">⤢</button>
    </div>`;
  const plate = $('#plate', stage);
  const view = { z: 1, x: 0, y: 0, base: 1, w: 0, h: 0 };
  function fit() {
    const r = stage.getBoundingClientRect(), pad = 16;
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
    // conserva el punt sota el cursor
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
    focusOn(t) { // si la làmina està ampliada, centra el vas indicat
      if (view.z === 1) return;
      view.x = -(t.x / 100 - .5) * view.w * view.z; view.y = -(t.y / 100 - .5) * view.h * view.z; apply();
    },
  };
}

function leader(svg, t, cls) {
  const sx = t.slotX;
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('x1', sx); el.setAttribute('y1', t.slotY); el.setAttribute('x2', t.x); el.setAttribute('y2', t.y);
  el.setAttribute('class', cls); el.dataset.for = t.id;
  svg.append(el);
  return el;
}

/* ---------- Fase 1 · Atles ---------- */
function atlasPhase() {
  const lvl = s.p1.level;
  if (lvl >= LEVELS.length) { s.phase = 2; s.p2.start = Date.now(); save(); return render(); }
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
      data-target="${t.id}" ${on ? '' : 'tabindex="-1" aria-hidden="true"'} aria-label="${done ? esc(t.name) : 'Casella buida'}">${done ? esc(t.name) : ''}</button>
      <button type="button" class="dot ${on ? '' : 'off'} ${done ? 'done' : ''}" style="left:${t.x}%;top:${t.y}%" data-target="${t.id}" tabindex="-1" aria-hidden="true"></button>`;
  }).join('');

  app.innerHTML = `
  <section class="play">
    <div class="stage" id="stage"></div>
    <aside class="panel">
      <header>
        <span class="kicker">${sysName} · nivell ${lvl + 1} de ${LEVELS.length}</span>
        <h1>${esc(L.title)}</h1>
        <p class="muted">${L.boss ? 'Totes les caselles de la làmina. Sense ajudes de regió.' : 'Les caselles grises són d\'altres nivells.'}</p>
      </header>
      <div><div class="row" style="justify-content:space-between"><span class="muted" id="count"></span><span class="muted" id="clock"></span></div><div class="bar"><span id="bar"></span></div></div>
      <div id="work">
        <p class="muted" style="margin-bottom:10px">Arrossega cada nom fins a la seva casella o el seu punt. També pots tocar un nom i després la casella.</p>
        <div class="bank" id="bank" role="list"></div>
      </div>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row" id="tools">
        <button type="button" class="btn ghost" id="hint">Pista (−5)</button>
      </div>
    </aside>
  </section>`;

  const stage = $('#stage');
  const P = mountPlate(stage, L.system, slots);
  cleanup = () => { P.dispose(); clearInterval(timer); };
  active.filter(t => placed[t.id]).forEach(t => leader(P.svg, t, ''));

  const bank = $('#bank');
  bank.innerHTML = s.p1.bank[lvl].map(n => `<button type="button" class="chip ${active.some(t => t.name === n && placed[t.id]) ? 'gone' : ''}" role="listitem" aria-pressed="false" data-name="${esc(n)}">${esc(n)}</button>`).join('');
  const fb = $('#fb');
  const say = (msg, kind) => { fb.textContent = msg; fb.className = 'feedback ' + kind; };
  let selected = null;
  const elapsed = () => stat.ms + (Date.now() - s.p1.levelStart);
  const timer = setInterval(() => { $('#clock').textContent = formatTime(elapsed()); }, 1000);

  function progress() {
    const n = active.filter(t => placed[t.id]).length;
    $('#count').textContent = `${n} de ${active.length} vasos`;
    $('#bar').style.width = (100 * n / active.length) + '%';
    $('#clock').textContent = formatTime(elapsed());
    if (n === active.length) finishLevel();
  }
  function select(chip) {
    $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', String(c === chip && c.getAttribute('aria-pressed') !== 'true')));
    selected = chip && chip.getAttribute('aria-pressed') === 'true' ? chip.dataset.name : null;
    $$('.dot.ping, .slot.ask').forEach(e => e.classList.remove('ping', 'ask'));
  }
  function attempt(name, id) {
    if (!name || !activeIds.has(id) || placed[id]) return;
    const t = targetById(id);
    $$('line.hint', P.svg).forEach(l => l.remove());
    $$('.ping, .ask').forEach(e => e.classList.remove('ping', 'ask'));
    if (t.name === name) {
      placed[id] = true;
      const r = score('hit', 1);
      $$(`[data-target="${id}"]`).forEach(e => { e.classList.add('done'); });
      const slot = $(`.slot[data-target="${id}"]`); slot.textContent = name; slot.setAttribute('aria-label', name);
      leader(P.svg, t, 'draw');
      $(`.chip[data-name="${CSS.escape(name)}"]`, bank)?.classList.add('gone');
      selected = null;
      say(r.bonus ? `Correcte: ${name}. Tres seguits, +${r.gained} punts.` : `Correcte: ${name}. +10 punts.`, 'ok');
      save(); progress();
      $('.chip:not(.gone)', bank)?.focus({ preventScroll: true });
    } else {
      stat.errors++;
      score('miss', 1);
      (s.review.atlas[name] ||= 0); s.review.atlas[name]++;
      save();
      $$(`[data-target="${id}"]`).forEach(e => {
        e.classList.remove('wrong'); void e.offsetWidth; e.classList.add('wrong');
        e.addEventListener('animationend', () => e.classList.remove('wrong'), { once: true });
      });
      say(`${name} no va en aquesta casella. −3 punts.`, 'err');
    }
  }

  // Arrossegar amb punter (ratolí, trackpad i pantalla tàctil)
  let drag = null;
  bank.addEventListener('pointerdown', e => {
    const chip = e.target.closest('.chip'); if (!chip || e.button > 0) return;
    drag = { chip, x: e.clientX, y: e.clientY, moving: false, ghost: null, over: null };
    chip.setPointerCapture(e.pointerId);
  });
  bank.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moving && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.moving = true;
      drag.ghost = Object.assign(document.createElement('div'), { className: 'ghost-chip', textContent: drag.chip.dataset.name });
      document.body.append(drag.ghost);
    }
    if (!drag.moving) return;
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-target]');
    if (drag.over && drag.over !== over) $$(`[data-target="${drag.over.dataset.target}"]`).forEach(x => x.classList.remove('drop'));
    if (over && activeIds.has(over.dataset.target)) $$(`[data-target="${over.dataset.target}"]`).forEach(x => x.classList.add('drop'));
    drag.over = over;
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    d.ghost?.remove();
    $$('.drop').forEach(x => x.classList.remove('drop'));
    if (!d.moving) return select(d.chip);
    const over = e.type === 'pointerup' ? document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-target]') : null;
    if (over) attempt(d.chip.dataset.name, over.dataset.target);
  };
  bank.addEventListener('pointerup', endDrag);
  bank.addEventListener('pointercancel', endDrag);
  bank.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e.target.closest('.chip')); } });
  stage.addEventListener('click', e => {
    const t = e.target.closest('[data-target]'); if (!t) return;
    if (!selected) return say('Primer tria un nom de la llista.', 'info');
    attempt(selected, t.dataset.target);
  });

  $('#hint').onclick = () => {
    if (!selected) return say('Tria primer un nom i la pista et mostrarà on va.', 'info');
    const t = active.find(x => x.name === selected);
    stat.hints++; score('hint', 1); save();
    $$(`[data-target="${t.id}"]`).forEach(e => e.classList.add(e.classList.contains('dot') ? 'ping' : 'ask'));
    leader(P.svg, t, 'hint');
    P.focusOn(t);
    say(`Pista: ${selected} és la casella assenyalada en ocre. −5 punts.`, 'info');
  };

  function finishLevel() {
    if (!stat.done) { stat.ms = elapsed(); stat.stars = stars(stat.errors, stat.hints); stat.done = true; save(); }
    clearInterval(timer);
    const st = stat.stars;
    $('#work').innerHTML = `
      <div class="done-card">
        <h2>Nivell completat</h2>
        <div class="stars" aria-label="${st} de 3 estrelles">${'★'.repeat(st)}<span class="no">${'★'.repeat(3 - st)}</span></div>
        <div class="stats">
          <div><span>Temps</span><b>${formatTime(stat.ms).replace(' min ', ':').replace(' s', '')}</b></div>
          <div><span>Errors</span><b>${stat.errors}</b></div>
          <div><span>Pistes</span><b>${stat.hints}</b></div>
        </div>
        <button class="btn sys" id="next">${lvl + 1 < LEVELS.length ? 'Següent nivell' : 'Comença el test'}</button>
      </div>`;
    $('#tools').hidden = true;
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
  <section class="quiz">
    <div>
      <div class="row" style="justify-content:space-between"><span class="kicker">Pregunta ${p.i + 1} de ${p.order.length}</span><span class="muted">Tecles 1–4 per respondre</span></div>
      <div class="bar" style="margin-top:6px"><span style="width:${100 * p.i / p.order.length}%"></span></div>
    </div>
    <h2>${esc(q)}</h2>
    <div class="choices" role="group" aria-label="Opcions">
      ${perm.map((o, k) => `<button type="button" class="choice" data-o="${o}"><kbd>${k + 1}</kbd><span>${esc(opts[o])}</span></button>`).join('')}
    </div>
    <div id="after"></div>
  </section>`;
  const show = picked => {
    $$('.choice').forEach(b => {
      b.disabled = true;
      const o = +b.dataset.o;
      if (o === right) b.classList.add('right');
      if (o === picked) b.classList.add('picked');
    });
    const ok = picked === right;
    $('#after').innerHTML = `
      <div class="explain"><b>${ok ? 'Correcte.' : 'Incorrecte. La resposta bona és la marcada en verd.'}</b> ${esc(why)}</div>
      <div class="row" style="margin-top:14px"><button class="btn" id="next">${p.i + 1 < p.order.length ? 'Següent pregunta' : 'Comença el mapa mut'}</button></div>`;
    $('#next').onclick = () => { p.i++; save(); render(); };
    $('#next').focus();
  };
  if (answered != null) show(answered);
  const choose = o => {
    if (p.answers[qi] != null) return;
    p.answers[qi] = o;
    const ok = o === right;
    score(ok ? 'hit' : 'miss', 2);
    if (!ok) s.review.quiz.push(qi);
    save(); show(o);
  };
  $('.choices').onclick = e => { const b = e.target.closest('.choice'); if (b) choose(+b.dataset.o); };
  const onKey = e => { const n = +e.key; if (n >= 1 && n <= 4 && !e.target.closest('input')) choose(perm[n - 1]); };
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
        <span class="kicker">${sys === 'art' ? 'Artèria' : 'Vena'} · ${p.i + 1} de ${p.order.length}</span>
        <h1>Quin vas és?</h1>
        <p class="muted">Escriu el nom del vas assenyalat. S'accepten accents o no, i noms en castellà habituals.</p>
      </header>
      <div class="bar"><span style="width:${100 * p.i / p.order.length}%"></span></div>
      <form class="answer" id="ans" autocomplete="off">
        <label class="field" for="term">Nom del vas</label>
        <input id="term" name="term" spellcheck="false" autocapitalize="off" placeholder="Per exemple: femoral">
        <div class="row"><button class="btn sys">Comprova</button><button type="button" class="btn ghost" id="hint">Inicials (−5)</button></div>
      </form>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <p class="muted">Intents per vas: ${MAP_TRIES}. Després es mostra la resposta i continues.</p>
    </aside>
  </section>`;
  const P = mountPlate($('#stage'), sys, dots + slot);
  leader(P.svg, t, 'hint');
  cleanup = () => P.dispose();
  const fb = $('#fb'), input = $('#term');
  input.focus();
  const say = (m, k) => { fb.textContent = m; fb.className = 'feedback ' + k; };
  const next = (ms = 1400) => setTimeout(() => { p.i++; p.tries = 0; p.hinted = false; save(); render(); }, ms);
  let locked = false;
  $('#ans').onsubmit = e => {
    e.preventDefault(); if (locked) return;
    const val = input.value; if (!normalize(val)) return say('Escriu un nom abans de comprovar.', 'info');
    const m = matchName(val, t.name, SYNONYMS);
    if (m) {
      locked = true; p.results[id] = p.tries ? 'retry' : 'ok';
      const r = score('hit', 3);
      $('.slot.ask').textContent = t.name; $('.slot.ask').className = `slot ${t.side} done`;
      say(m === 'typo' ? `Correcte: ${t.name}. Revisa l'ortografia.` : `Correcte: ${t.name}.${r.bonus ? ' Tres seguits, +15.' : ''}`, 'ok');
      save(); return next(900);
    }
    p.tries++; score('miss', 3);
    if (p.tries >= MAP_TRIES) {
      locked = true; p.results[id] = 'miss'; s.review.map.push(id); save();
      $('.slot.ask').textContent = t.name;
      say(`Era ${t.name}. L'afegim a la llista de repàs.`, 'err');
      return next(2200);
    }
    save(); say('No és correcte. Torna-ho a provar.', 'err'); input.select();
  };
  $('#hint').onclick = () => {
    if (p.hinted || locked) return;
    p.hinted = true; score('hint', 3); save();
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
      <td class="num">${st.stars ? '★'.repeat(st.stars) : '—'}</td><td class="num">${st.errors ?? 0}</td><td class="num">${st.hints ?? 0}</td><td class="num">${st.ms ? formatTime(st.ms) : '—'}</td></tr>`;
  }).join('');
  const atlasMiss = Object.entries(s.review.atlas).sort((a, b) => b[1] - a[1]);
  const mapMiss = s.review.map.map(targetById);
  const quizMiss = s.review.quiz.map(qi => QUIZ[qi]);
  app.innerHTML = `
  <section class="report" id="report">
    <header style="display:grid;gap:6px">
      <h1>Informe de Vascular Quest · RA2</h1>
      <p><b>${esc(s.email)}</b> · ${new Date(s.end || Date.now()).toLocaleString('ca-ES')} · temps total ${formatTime(totalMs)}</p>
    </header>
    <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
      <div><span>Punts</span><b>${s.points}</b></div>
      <div><span>Atles</span><b>${s.phasePts[1]}</b></div>
      <div><span>Test</span><b>${quizOk}/${s.p2.order.length}</b></div>
      <div><span>Mapa mut</span><b>${mapOk}/${s.p3.order.length}</b></div>
      <div><span>Errors</span><b>${s.errors}</b></div>
      <div><span>Pistes</span><b>${s.hints}</b></div>
    </div>
    <div>
      <h2 style="margin-bottom:8px">Atles per nivells</h2>
      <table><thead><tr><th>Nivell</th><th class="num">Estrelles</th><th class="num">Errors</th><th class="num">Pistes</th><th class="num">Temps</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div style="display:grid;gap:10px">
      <h2>Per repassar</h2>
      ${atlasMiss.length ? `<p class="muted">Noms col·locats malament a l'atles (vegades):</p><div class="tags">${atlasMiss.map(([n, c]) => `<span class="tag">${esc(n)} × ${c}</span>`).join('')}</div>` : ''}
      ${mapMiss.length ? `<p class="muted">Vasos no reconeguts al mapa mut:</p><div class="tags">${mapMiss.map(t => `<span class="tag ${systemOf(t.id)}">${esc(t.name)}</span>`).join('')}</div>` : ''}
      ${quizMiss.length ? `<p class="muted">Preguntes del test fallades:</p><ul style="margin:0;padding-left:1.2em">${quizMiss.map(q => `<li>${esc(q[0])} <b>${esc(q[1][q[2]])}</b></li>`).join('')}</ul>` : ''}
      ${!atlasMiss.length && !mapMiss.length && !quizMiss.length ? '<p>Cap error en tot el recorregut.</p>' : ''}
    </div>
    <div class="no-print" style="display:grid;gap:10px">
      <div class="row"><button class="btn" id="pdf">Desa l'informe en PDF</button><button class="btn ghost" id="mail">Obre un correu al professor</button></div>
      <p class="muted">Al diàleg d'impressió tria «Desa com a PDF». El correu s'obre amb el resum, però el PDF l'has d'adjuntar tu abans d'enviar-lo.</p>
    </div>
  </section>`;
  $('#pdf').onclick = () => window.print();
  $('#mail').onclick = () => {
    const body = `Informe de Vascular Quest · RA2\nAlumne: ${s.email}\nPunts: ${s.points}\nTest: ${quizOk}/${s.p2.order.length}\nMapa mut: ${mapOk}/${s.p3.order.length}\nErrors: ${s.errors} · Pistes: ${s.hints}\nTemps: ${formatTime(totalMs)}\n\nAdjunto l'informe en PDF.`;
    location.href = `mailto:${TEACHER}?subject=${encodeURIComponent('AP RA2 · Vascular Quest · ' + s.email)}&body=${encodeURIComponent(body)}`;
  };
}

render();
