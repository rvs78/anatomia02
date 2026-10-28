# DESIGN — Vascular Quest · «Àlbum de cromos»

Cada nivell és una pàgina d'un àlbum de cromos: col·locar un nom és enganxar el cromo al seu forat. La làmina anatòmica és sagrada: cap efecte la tapa, la mou ni la deforma.

## Color

| Token | Valor | Ús |
| --- | --- | --- |
| `--cover` | `#22194d` | Coberta de l'àlbum: capçalera, panell, sobre d'instruccions |
| `--cover-2` / `--cover-3` | `#2f2466` / `#3d3080` | Pestanyes, camps, vores sobre la coberta |
| `--page` | `#f2b42c` | Pàgina de l'àlbum (fons de la làmina, test, informe) amb trama de punts `--page-dot` |
| `--paper` | `#fffdf8` | Cara dels cromos i fitxes |
| `--art` | `#d7263d` | Artèria (sistema) |
| `--ven` | `#1f5fbf` | Vena (sistema) |
| `--foil` | `#ffd86b` | Daurat: botó principal, estrelles, ratxa, selecció |
| `--ok` / `--err` | `#138a52` / `#c81e3a` | Encert / error (sempre amb icona i text) |

`--sys` val `--art` o `--ven` segons la pàgina (`body[data-system]`) i pinta cromos, forats plens, línies guia i barra de progrés.

## Tipografia

- **Big Shoulders Display** 800–900: títols, cromos, números, botons.
- **Atkinson Hyperlegible** 400–700: text, ajudes, formularis.
- Totes dues servides des de `assets/fonts/` (llicència OFL).

## Components

- **Cromo** (`.chip`): cara blanca, marc interior del color del sistema i el punt del vas a l'esquerra; lleugerament inclinat al munt; seleccionat = marc daurat.
- **Forat** (`.slot`): vora discontínua; ple = fons del sistema, vora blanca retallada i brillantor.
- **Pàgina** (`.stage` + `.plate`): làmina blanca amb marge, número de pàgina, zoom a la cantonada.
- **Sobre** (`.intro`): tira dentada daurada, vídeo «Com es juga» i tres fitxes d'instrucció.
- **Icones**: sprite SVG propi a `index.html` (traç 2,2, arrodonit).

## Moviment (`fx.js`)

| Moment | Efecte | Durada |
| --- | --- | --- |
| Encert | El cromo vola fins al forat, cop d'escala, brillantor, +10 i espurnes, so ascendent | 260–520 ms |
| Error | Sacsejada del forat, el cromo rebota i torna al munt, −3, so greu | 360–620 ms |
| Ratxa de 3 | Bàner daurat inclinat «Ratxa de 3! +15», arpegi | 1,5 s |
| Pàgina completa | Estrelles segellades una a una | 250 ms + 260 ms/estrella |
| Instruccions | El sobre puja, la tira s'obre i les fitxes es despleguen | 480–850 ms |

Corba: `cubic-bezier(0.16, 1, 0.3, 1)`. Amb `prefers-reduced-motion` no hi ha vols ni rebots; es mantenen els canvis d'estat i color. Durant un vol s'ignoren altres intents.

## So

Sintetitzat amb Web Audio (sense fitxers). Activat per defecte; botó de silenci a la capçalera, desat a `localStorage['vq-sound']`.

## Vídeo

`video/` és un projecte Remotion (`ComEsJuga`, 1280×720, 12 s) amb la làmina real i els mateixos tokens. `cd video && npm i && npm run render` regenera `assets/tutorial.mp4` i `assets/tutorial.jpg`.
