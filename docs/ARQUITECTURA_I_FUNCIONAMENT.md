# Especificació tècnica i arquitectura — Vascular Quest RA2

> Document descriptiu del **codi real a `main`**, no una promesa de funcionalitats futures. Revisat el 28/10/2026.

## 1. Identificació i desplegament

- Repositori: https://github.com/rvs78/anatomia02
- Aplicació: https://rvs78.github.io/anatomia02/
- Branca de publicació: `main` (GitHub Pages).
- Pila: **HTML + CSS + JavaScript ES Modules**. No hi ha backend d'aplicació ni base de dades.
- Model 3D: **Three.js 0.160.1**, importat dinàmicament des de jsDelivr; requereix connexió a Internet.
- La contrasenya compartida es comprova al **navegador**: és una barrera d'entrada didàctica, **no** autenticació segura.

## 2. Estructura del repositori

| Element | Funció |
| --- | --- |
| `index.html` | Carcassa HTML, navegació superior i diverses capes CSS de la interfície |
| `game.js` | Login, estat local, fases, punts, mapa ampliable, test, escena 3D i resum |
| `data.js` | `regions` (nivells i noms de vasos) i `quiz` (preguntes i resposta correcta) |
| `assets/atlas_art.webp` | Atles arterial de la presentació/PDF del RA2, editat per ocultar etiquetes |
| `assets/atlas_ven.webp` | Atles venós de la mateixa font, editat per ocultar etiquetes |
| `assets/*.webp` | Altres reculls de làmines regionals, actualment **no utilitzats** per la fase 1 principal |
| `scripts/import_ra2_canva.py` | Descàrrega de miniatures de Canva i tractament d'imatges |
| `.github/workflows/import-ra2-assets.yml` | GitHub Action per executar la importació si es modifica el script o s'activa manualment |
| `docs/` | Guia d'ús, especificació, auditoria gràfica i pla de feina |

### Advertiment de manteniment dels recursos

La importació automàtica usa **URLs de Canva signades i temporals**, que poden caducar. **Tornar a executar aquest workflow pot sobreescriure** `assets/atlas_art.webp` i `assets/atlas_ven.webp` amb miniatures diferents de les dues imatges finals preparades manualment des del PDF. Abans de reexecutar-lo, cal refactoritzar la importació per preservar els recursos finals i emprar una font estable i autoritzada. No s'ha de confondre el workflow actual amb un pipeline de producció segur.

## 3. Model de dades

`data.js` exporta:

- `regions`: array de **9 elements** amb un títol de nivell i un array de noms. Actualment hi ha **76 col·locacions** en total: `[8,6,7,6,18,6,5,4,16]`. **No són 76 vasos únics**, perquè hi ha repeticions per reforç.
- `quiz`: **20 elements** amb enunciat, quatre alternatives i índex de resposta correcta.

`game.js` conserva un objecte d'estat sota la clau `localStorage['ap-ra2-vascular-v4']`, que inclou:

```js
{
  email, phase, level, q, points, streak,
  correct, errors, hints,
  placements, answers, model,
  start
}
```

- `phase`: 0 (login), 1 (atles), 2 (test), 3 (3D), 4 (resum).
- `level`: índex del nivell del mapa, de 0 a 8.
- `placements[level][i]`: punts del nivell resolts.
- `q` i `answers`: progrés del test.
- `model[i]`: punts del model 3D resolts.
- `correct`, `errors`, `hints`, `points`, `streak`: comptadors totals.

La persistència és local; **no hi ha validació contra el domini ISVH més enllà d'una expressió regular**, ni contrasenyes individuals, ni sincronització entre dispositius.

## 4. Mecàniques de les fases

### Fase 1 — mapa

- Les primeres **5 regions són arterials** i les darreres **4 venoses**.
- A cada nivell es renderitza l'atles corresponent amb botons de posició, calculats a partir de `vascularPositions`.
- El conjunt de noms i marcadors es genera amb `names.map(...)`; per tant, el nombre és 1:1 dins de cada nivell.
- Entrada: `dragstart` → `drop` o selecció de nom → clic al marcador.
- En encert: `placements` registra la resposta, s'atorguen punts i desapareix el nom pendent.
- En error: penalització i possibilitat de reintentar.
- Zoom: botons, roda i desplaçament; CSS de la imatge i de l'overlay a `index.html`.

**Defecte funcional pendent (P0):** el banc mostra números d'ordre que coincideixen directament amb l'índex dels marcadors, de manera que es poden deduir respostes sense identificar el vas. Cal desacoblar ordre visual i ID correcte abans de considerar qualificable la fase.

**Defecte pedagògic pendent (P0):** `vascularPositions` encara necessita auditoria individual sobre les làmines, especialment venes i variants de nom, a totes les resolucions.

### Fase 2 — qüestionari

- Cada pregunta té **una única opció vàlida**.
- Una vegada marcada, es registra el resultat, es bloquegen les alternatives i apareix `Continua`.
- No hi ha randomització ni banc de versions del test.

### Fase 3 — 3D

- `markers` es construeix agafant les **primeres 15 entrades arterials** i les **primeres 15 venoses** de les regions, aplanades. Pot haver-hi **vasos repetits**.
- L'escena 3D utilitza geometries primitives (esferes, cilindres) i punts disposats per una **fórmula d'índex**, no per coordenades reals d'un model anatòmic.
- S'interactua amb `raycasting` de Three.js; zoom amb roda i rotació amb el ratolí.
- `normalize` ignora accents i majúscules i contempla algunes equivalències, **no** un diccionari exhaustiu català/castellà.
- En fallar la càrrega de Three.js, hi ha un selector alternatiu per número.

### Puntuació

`award(n)` aplica **+10** encert, **−3** error, **−5** pista. La puntuació mínima és 0; cada **3 encerts consecutius** afegeix **+15**. Errors i pistes reinicien la ratxa, compartida entre fases. El valor `correct` és el total de respostes correctes, no el nombre de vasos únics.

## 5. Resum i entrega

- `finish()` mostra un informe HTML amb els totals.
- `Desa PDF` crida `window.print()`: el PDF **només s'obté si l'usuari selecciona guardar com a PDF**.
- `Prepara correu` obre un `mailto:` cap a `ruben.vallejo@isvh.cat` amb assumpte/cos.
- **No s'adjunta cap PDF automàticament, no s'envia cap correu des del servidor, no es desa en Drive i no es genera un Sheet**.
- La recollida posterior a Gmail/Drive/Sheets pertany a un altre agent o procediment.

## 6. Desenvolupament i execució local

```bash
git clone https://github.com/rvs78/anatomia02.git
cd anatomia02
python3 -m http.server 8000
```

Obre `http://localhost:8000` (els mòduls JS no s'han de provar fent doble clic a l'HTML si el navegador bloqueja els imports locals).

Per a qualsevol canvi de `data.js` o `vascularPositions`:

1. Validar que totes les entrades tenen coordenades compatibles amb l'atles actiu.
2. Comprovar que els noms correctes no es filtren per números/ordre visual o etiquetes impreses.
3. Fer proves en totes les resolucions del [protocol de QA](FASE1_GRAFICS_I_USABILITAT.md).
4. Considerar la compatibilitat de l'estat local anterior abans de canviar els nivells (clau `-v4`).
5. Publicar i verificar `main` i el desplegament de Pages.

## 7. Fonts didàctiques

- Canva: **RA2.2. Vasos Sanguinis i Circulació (redisseny)**, disseny `DAHYn8UO7FY`.
- PDF homònim a Drive: https://drive.google.com/file/d/1kjTjWhJPGIaM-jAHz2pQxiU-tU1qnu2Z/view
- Els gràfics distribuïts en el repositori s'han d'utilitzar respectant els drets de la font original. **La presència al repositori no equival a una llicència de redistribució verificada**.

Per al risc actual, consulta [ESTAT_I_PENDENTS.md](ESTAT_I_PENDENTS.md).
