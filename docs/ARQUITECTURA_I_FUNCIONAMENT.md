# Arquitectura i funcionament — Vascular Quest RA2

> Descriu el codi de `main`. Revisat el 28/10/2026 (versió 5).

## 1. Desplegament

- Repositori: https://github.com/rvs78/anatomia02 · Aplicació: https://rvs78.github.io/anatomia02/ (GitHub Pages, branca `main`).
- Pila: HTML + CSS + JavaScript ES Modules, sense dependències d'execució ni backend. Només es carreguen de fora les tipografies (Google Fonts); sense connexió s'usen les del sistema.
- GitHub Actions executa `node tests/check.mjs` a cada push.

## 2. Fitxers

| Fitxer | Funció |
| --- | --- |
| `index.html` | Carcassa: capçalera (fases, punts, ratxa) i `<main id="app">` |
| `styles.css` | Sistema visual únic (tokens de color, tipografia, làmina, panell, test, informe, impressió) |
| `game.js` | Estat, entrada, làmina amb zoom/desplaçament, fases 1–3 i informe |
| `logic.js` | Funcions pures: normalització, comparació de noms, barreja, puntuació, estrelles |
| `data.js` | `LEVELS` (nivells per noms), `QUIZ` (banc de 44 preguntes amb explicació), `SYNONYMS` |
| `atlas-data.js` | **Generat.** Coordenades de cada vas i de la seva casella + clau de noms |
| `assets/src/atlas_*.png` | Làmines font (meitats de la diapositiva 56 sense rètols) |
| `assets/atlas_*.webp` | Làmines publicades (sense claudàtors, fons netejat) |
| `scripts/build_atlas.py` | Detecció de punts i claudàtors, assignació per línia guia, neteja i evidències |
| `tests/check.mjs` | 328 comprovacions de coherència |
| `tests/e2e.py` | Partida completa al navegador (Playwright) i proves de resolució |
| `docs/validacio/*.png` | Làmines amb cada nom sobre el seu punt i l'ajust de la línia guia |

## 3. Dades anatòmiques

Cada objectiu d'`ATLAS[sistema].targets` té:

```js
{ id: 'art-07', name: 'Radial', side: 'L', slotX: 27.93, slotY: 46.9, x: 37.03, y: 41.92, fit: 0.97 }
```

- `x, y`: centre del punt negre del vas (% de la làmina).
- `slotX, slotY`: claudàtor original del rètol, on es dibuixa la casella.
- `fit`: proporció de píxels de línia guia entre claudàtor i punt (mínim exigit 0,75; actual ≥ 0,82).

Els nivells referencien vasos **per nom**; `tests/check.mjs` verifica que cada nom existeix a la làmina del seu sistema, que no hi ha duplicats i que tots els vasos surten en algun nivell regional.

### Regenerar les làmines

1. Desa les meitats esquerra (artèries) i dreta (venes) de la diapositiva 56, **sense rètols**, com a `assets/src/atlas_art.png` i `assets/src/atlas_ven.png`. Qualsevol resolució serveix.
2. `python3 scripts/build_atlas.py`. Si no troba exactament 18 i 16 punts i claudàtors, o una línia guia és dubtosa, s'atura amb un missatge.
3. Revisa `docs/validacio/` i executa `node tests/check.mjs`.

## 4. Estat i persistència

`localStorage['ap-ra2-vascular-v5']`:

```js
{ v:5, email, phase /*1 atles, 2 test, 3 mapa, 4 informe*/, start, end,
  points, streak, correct, errors, hints, phasePts:{1,2,3},
  p1:{ level, placed:{[nivell]:{[id]:true}}, stats:{[nivell]:{errors,hints,ms,stars}}, bank:{[nivell]:[noms barrejats]} },
  p2:{ order:[índexs], perm:{[q]:[ordre opcions]}, i, answers:{} },
  p3:{ order:[ids], i, tries, hinted, results:{[id]:'ok'|'retry'|'miss'} },
  review:{ atlas:{[nom]:vegades}, quiz:[índexs], map:[ids] } }
```

L'ordre del banc, de les preguntes i de les opcions es fixa en començar i es desa: recarregar no permet tornar a sortejar.

## 5. Mecàniques

**Fase 1.** La làmina és un element amb les caselles i els punts en coordenades percentuals; el zoom (1×–3×, botons i roda centrada al cursor) i el desplaçament transformen tot el conjunt, de manera que res es desalinea. L'arrossegament usa *pointer events* (ratolí, trackpad i tàctil); alternativa: tocar el nom i després la casella o el punt; també amb teclat (Tab + Enter). Els noms del banc no porten cap número. Un encert no redibuixa la pantalla: s'omple la casella, s'il·lumina la línia guia del color del sistema i es conserva el zoom. La pista demana triar un nom i n'assenyala la casella (−5).

**Fase 2.** 20 preguntes de `QUIZ` a l'atzar, opcions barrejades, tecles 1–4, explicació després de respondre.

**Fase 3 (Mapa mut).** Substitueix l'antic «explorador 3D», que era una figura de primitives amb punts posats per fórmula i, per tant, no podia ser exacte. Ara s'assenyala un vas real de la làmina i s'escriu el nom. `matchName` ignora majúscules, accents, l·l, prefixos («artèria», «vena»), lateralitat i accepta sinònims (`SYNONYMS`, català i castellà) i una errada tipogràfica en noms de 7 o més lletres.

**Puntuació** (`logic.js`): +10 / −3 / −5; cada 3 encerts seguits +15; ratxa global; mínim 0.

## 6. Informe i lliurament

Mostra punts totals i per fase, estrelles/errors/pistes/temps per nivell i la llista de repàs (noms mal col·locats, vasos no reconeguts, preguntes fallades). «Desa l'informe en PDF» obre la impressió del navegador amb un full net. «Obre un correu al professor» prepara un `mailto:` amb el resum; **el PDF s'adjunta manualment**. No hi ha enviament automàtic ni connexió amb Drive o Sheets.
