# Àlbum de cromos — pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redissenyar Vascular Quest com un àlbum de cromos jugable, amb efectes de moviment i so en encerts, errors i instruccions, sense alterar la làmina ni la lògica verificada.

**Architecture:** Es manté l'estructura actual (`game.js` render per fases, `logic.js` pur, `data.js`, `atlas-data.js` generat). S'hi afegeixen dos mòduls de presentació sense estat de joc: `fx.js` (moviment i so) i el sistema visual nou a `styles.css`. El vídeo d'instruccions es genera amb Remotion en un subprojecte `video/` i es publica com a `assets/tutorial.mp4`.

**Tech Stack:** HTML/CSS/JS ES Modules; Web Audio API; Web Animations API; Remotion 4 (només en build); Node 20; Playwright (proves).

**Spec:** `.impeccable/surfaces/index-html.md` (contracte de direcció) i `PRODUCT.md`.

## Global Constraints

- La làmina (`.plate img`) mai es transforma per efectes: només el zoom de l'usuari.
- Cap número ni ordre visual pot correlacionar un nom amb la seva casella.
- `prefers-reduced-motion: reduce` → cap vol ni rebot; només canvis d'estat i color.
- So activat per defecte, botó de silenci a la capçalera, preferència a `localStorage['vq-sound']` (`'on'|'off'`).
- Interfície en català. Colors: artèria `#d7263d`, vena `#1f5fbf`, coberta `#22194d`, pàgina `#f2b42c`, daurat `#ffd86b`.
- Tipografies: Big Shoulders Display (títols), Atkinson Hyperlegible (text).
- Puntuació i persistència (`ap-ra2-vascular-v5`) no canvien.
- `node tests/check.mjs` i `python3 tests/e2e.py` han de passar al final de cada tasca.

## Review Focus

1. Clic ràpid en dos forats mentre un cromo vola → un sol intent registrat (bloqueig durant l'animació).
2. Navegador sense Web Audio o amb l'autoplay bloquejat → el joc continua sense errors de consola.
3. El sobre d'instruccions no pot bloquejar la partida si el vídeo no carrega → botó «Comença» sempre actiu.
4. Recarregar a mig nivell → els cromos ja enganxats apareixen enganxats sense tornar a animar.
5. Mòbil 390 px → el sobre i els cromos caben sense scroll horitzontal.

---

### Task 1: Mòdul d'efectes i so (`fx.js`)

**Files:** Create `fx.js` · Modify `tests/check.mjs`

**Interfaces — Produces:**
- `sound.play(kind: 'hit'|'miss'|'hint'|'bonus'|'level'|'open'): void` — no fa res si està silenciat o no hi ha `AudioContext`.
- `sound.enabled(): boolean`, `sound.toggle(): boolean`.
- `fly(fromEl: Element, toEl: Element, label: string, kind: 'art'|'ven'): Promise<void>` — resol a l'instant amb moviment reduït.
- `bounceBack(fromPoint: {x,y}, toEl: Element, label): Promise<void>`.
- `burst(el: Element, text: string): void` — +10 flotant i espurnes.
- `reduced(): boolean`.

- [ ] Test: `check.mjs` importa `fx.js` en Node i comprova que `sound.play('hit')` i `reduced()` no llancen sense `window`.
- [ ] Implementar amb Web Audio (oscil·ladors curts: hit = dos tons ascendents 660→990 Hz, miss = 140 Hz serra 0,18 s, bonus = arpegi de 3 notes, level = 4 notes) i Web Animations.
- [ ] `node tests/check.mjs` → passa. Commit.

### Task 2: Sistema visual «àlbum» (`styles.css`, `index.html`)

**Files:** Modify `styles.css`, `index.html`

- [ ] Tokens del contracte; capçalera i panell en coberta; escenari amb pàgina groga i trama de punts; làmina amb marge blanc i número de pàgina a la cantonada.
- [ ] Components: `.chip` → cromo (vora blanca, franja de sistema, brillantor); `.slot` → forat discontinu; `.slot.done` → cromo enganxat; pestanyes de fase; botons amb volum.
- [ ] Botó de so a la capçalera (`#sound`, `aria-pressed`).
- [ ] Captures a 1366 i 390; cap solapament (e2e). Commit.

### Task 3: Moviment en encerts, errors, ratxa i nivell (`game.js`)

**Files:** Modify `game.js`, `tests/e2e.py`

**Interfaces — Consumes:** Task 1.

- [ ] e2e: després d'un encert, la casella té `.done` en ≤ 1 s; durant el vol un segon clic no suma errors (Review Focus 1).
- [ ] Encert: `fly(chip, slot)` → enganxar → `burst(slot,'+10')` → `sound.play('hit'|'bonus')`. Error: `bounceBack` + sacsejada + `sound.play('miss')`. Pista: so + pols ocre. Final de nivell: estrelles segellades una a una + `sound.play('level')`.
- [ ] Test i mapa mut: mateix llenguatge (encert verd amb segell, error amb sacsejada, sons).
- [ ] e2e complet passa. Commit.

### Task 4: Sobre d'instruccions i vídeo Remotion

**Files:** Create `video/` (Remotion), `assets/tutorial.mp4`, `assets/tutorial.jpg` · Modify `game.js`, `styles.css`

- [ ] Composició `ComEsJuga` 1280×720, 30 fps, 12 s: sobre que s'obre, cromo que vola al forat i s'enganxa (+10), cromo equivocat que rebota, estrelles. Usa la làmina real `assets/atlas_art.webp`.
- [ ] `npx remotion render` → `assets/tutorial.mp4` (< 1,5 MB) i pòster.
- [ ] Overlay `#intro` a l'inici de cada fase (una vegada per fase, `s.seen[fase]`): sobre que s'obre i 3 cartes d'instruccions; a la fase 1, el vídeo en bucle sense so. «Comença» sempre actiu (Review Focus 3); Esc tanca.
- [ ] e2e: l'overlay apareix i es tanca; després la partida continua. Commit.

### Task 5: Verificació, documentació i publicació

- [ ] `node tests/check.mjs`, `python3 tests/e2e.py` a 1280/1366/1440/1920/390; captures revisades.
- [ ] `impeccable detect` sobre `styles.css`/`index.html`; corregir troballes rellevants.
- [ ] Actualitzar README i ARQUITECTURA (fx.js, vídeo, so); escriure `DESIGN.md`.
- [ ] Push a `main`; verificar CI i Pages.
