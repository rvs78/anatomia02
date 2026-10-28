// Proves de coherència: node tests/check.mjs
import assert from 'node:assert/strict';
import { ATLAS } from '../atlas-data.js';
import { LEVELS, QUIZ, SYNONYMS } from '../data.js';
import { normalize, matchName, shuffle, applyScore, stars } from '../logic.js';
import * as fx from '../fx.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

for (const sys of ['art', 'ven']) {
  const T = ATLAS[sys].targets, names = T.map(t => t.name);
  ok(new Set(names).size === names.length, `${sys}: noms duplicats a la làmina`);
  ok(new Set(T.map(t => t.id)).size === T.length, `${sys}: ids duplicats`);
  for (const t of T) {
    ok(t.fit >= 0.75, `${t.name}: línia guia dubtosa`);
    ok(t.x > 30 && t.x < 70 && t.y > 0 && t.y < 100, `${t.name}: punt fora del cos`);
    ok(SYNONYMS[t.name] !== undefined, `${t.name}: falta entrada de sinònims`);
  }
  // cada costat ordenat de dalt a baix sense solapaments de caselles (>= 4 % de separació)
  for (const side of ['L', 'R']) {
    const ys = T.filter(t => t.side === side).map(t => t.slotY).sort((a, b) => a - b);
    ys.slice(1).forEach((y, i) => ok(y - ys[i] >= 4, `${sys}/${side}: caselles massa juntes`));
  }
  // tots els vasos apareixen en algun nivell
  const used = new Set(LEVELS.filter(l => l.system === sys).flatMap(l => l.names === 'ALL' ? [] : l.names));
  names.forEach(nm => ok(used.has(nm), `${sys}: ${nm} no surt en cap nivell regional`));
}
for (const L of LEVELS) {
  if (L.names === 'ALL') continue;
  const names = ATLAS[L.system].targets.map(t => t.name);
  L.names.forEach(nm => ok(names.includes(nm), `Nivell «${L.title}»: ${nm} no existeix a la làmina`));
  ok(new Set(L.names).size === L.names.length, `Nivell «${L.title}»: noms repetits`);
}
ok(QUIZ.length >= 20, 'Calen almenys 20 preguntes');
for (const [q, o, r, why] of QUIZ) {
  ok(o.length === 4 && new Set(o).size === 4, `Opcions incorrectes: ${q}`);
  ok(r >= 0 && r < 4 && why, `Resposta o explicació: ${q}`);
}
// Normalització i sinònims
ok(normalize('Artèria Axil·lar') === 'axillar', 'axil·lar');
ok(matchName('axilar', 'Axil·lar', SYNONYMS) === 'exact', 'axilar castellà');
ok(matchName('vena safena interna', 'Safena magna', SYNONYMS) === 'exact', 'safena interna');
ok(matchName('arteria ulnar', 'Cubital', SYNONYMS) === 'exact', 'ulnar');
ok(matchName("arc de l'aorta", 'Arc aòrtic', SYNONYMS) === 'exact', "arc de l'aorta");
ok(matchName('caroitda comuna', 'Caròtida comuna', SYNONYMS) === null, 'dues errades no valen');
ok(matchName('carotda comuna', 'Caròtida comuna', SYNONYMS) === 'typo', 'una errada en nom llarg');
ok(matchName('renal', 'Radial', SYNONYMS) === null, 'renal ≠ radial');
ok(matchName('femoral', 'Femoral (vena)'.replace(' (vena)', ''), SYNONYMS) === 'exact', 'femoral');
ok(matchName('', 'Renal', SYNONYMS) === null, 'buit');
// Barreja i puntuació
const sh = shuffle([1, 2, 3, 4, 5]); ok(sh.length === 5 && [...sh].sort().join() === '1,2,3,4,5', 'shuffle');
const s = { points: 0, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: {} };
applyScore(s, 'hit', 1); applyScore(s, 'hit', 1); const r = applyScore(s, 'hit', 1);
ok(s.points === 45 && r.bonus, 'bonus de ratxa: 3×10 + 15');
applyScore(s, 'miss', 1); ok(s.points === 42 && s.streak === 0 && s.errors === 1, 'error −3');
applyScore(s, 'hint', 1); ok(s.points === 37 && s.hints === 1, 'pista −5');
const z = { points: 2, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: {} };
applyScore(z, 'hint', 1); ok(z.points === 0 && z.phasePts[1] === -2, 'mínim 0');
ok(stars(0, 0) === 3 && stars(1, 1) === 2 && stars(2, 1) === 1, 'estrelles');
// Efectes: segurs sense navegador (Node no té window ni AudioContext)
ok(typeof fx.sound.play === 'function' && typeof fx.fly === 'function', 'fx exporta sound i fly');
fx.sound.play('hit'); fx.sound.play('miss');
ok(fx.reduced() === true, 'sense window es considera moviment reduït');
ok(typeof fx.sound.enabled() === 'boolean', 'sound.enabled');
await fx.fly(null, null, 'x', 'art'); n++;
console.log(`✓ ${n} comprovacions superades`);
