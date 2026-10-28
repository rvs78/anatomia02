# Fase 1 — Gràfics anatòmics, coordenades i usabilitat

**Estat: necessita revisió final.** Aquest document registra els criteris que cal complir abans d'usar la fase 1 amb notes oficials. Actualització: 28/10/2026.

## Objectiu docent

L'alumne ha d'identificar **un vas sanguini real** sobre una il·lustració anatòmica fidel a la presentació «RA2.2. Vasos Sanguinis i Circulació (redisseny)», sense pistes involuntàries a la interfície. No ha de limitar-se a relacionar números iguals.

## Font gràfica i fitxers

- Presentació Canva: `DAHYn8UO7FY`, versió «redisseny».
- PDF de Drive: `RA2.2.Vasos Sanguinis i Circulació (redisseny).pdf`.
- Atles publicats: `assets/atlas_art.webp`, `assets/atlas_ven.webp`.
- Altres fitxers regionals a `assets/`: aorta, cap, braç, abdomen, cames i xarxes venoses; no tots s'usen actualment.
- Els atlas incorporen modificacions per amagar noms/respostes originals, però **encara cal comprovar que no es mostrin rètols reveladors ni es tallin estructures**.
- La resolució, el contrast i el detall anatòmic han de ser suficients a 100%, 125%, 150% i zoom intern. No consta una homologació visual a les resolucions proposades.

### Nivells actuals segons `data.js`

| Nivell | Tipus | Descripció | Etiquetes/marcadors |
| --- | --- | --- | ---: |
| 1 | Artèries | Tronc, coll i grans artèries | 8 |
| 2 | Artèries | Cap, coll i extremitat superior | 6 |
| 3 | Artèries | Abdomen i pelvis | 7 |
| 4 | Artèries | Extremitat inferior | 6 |
| 5 | Artèries | Repte general de l'atles | 18 |
| 6 | Venes | Cap, coll i retorn central | 6 |
| 7 | Venes | Extremitat superior | 5 |
| 8 | Venes | Abdomen i pelvis | 4 |
| 9 | Venes | Repte general de l'atles | 16 |
| | | **Total** | **76** |

Són **76 col·locacions**, no 76 noms de vasos diferents: els nivells de repàs reutilitzen estructures.

## Incidències detectades a partir del codi actual

### P0 — Bloquegen l'avaluació

- [ ] **Respostes revelades:** els botons del banc mostren un número `i+1` i els marcadors anatòmics mostren el mateix número. Un alumne pot encertar per coincidència de número sense conèixer l'anatomia. **Eliminar la coincidència**: fer servir identificadors interns opacs; remenar les opcions o mostrar icones no correlacionades.
- [ ] **Precisió dels punts:** `vascularPositions` té coordenades percentuals assignades manualment; cal comprovar cada punt anatòmic i si s'associa al vas correcte. Registrar les correccions per nivell i vas, amb captura abans/després.
- [ ] **Variants arterials i venoses:** diversos noms (`Renal`, `Femoral`, `Ilíaca comuna`, etc.) apareixen en tots dos sistemes. El codi utilitza sufixos `(vena)` per a alguns. Revisar la coherència d'aquesta correspondència i que cap punt venós empri inadvertidament una posició arterial.
- [ ] **Escalat real:** l'atles està contingut en una imatge WebP amb bandes retallades visualment mitjançant CSS. Verificar coincidència exacta dels percentatges de `vascularPositions` amb la caixa de coordenades dibuixada.
- [ ] **Contingut visible:** assegurar que tots els vasos requerits siguin representats i distinguibles; si no hi són, substituir la làmina regional i no mantenir una resposta impossible.
- [ ] **Qualitat de l'avaluació:** no atribuir puntuació oficial fins que hi hagi revisió anatòmica i proves interactives satisfactòries.

### P1 — Dificulten la usabilitat

- [ ] **Densitat d'etiquetes:** nivells 5 (18) i 9 (16) han de mostrar-se sense saturació ni solapaments. Valorar agrupació per regió, llista amb scroll i assistència d'accessibilitat.
- [ ] **Gestos al touchpad/ratolí:** cal provar `dragstart/drop` i selecció per dos clics en Chromium, Edge, Firefox i Chrome.
- [ ] **Zoom i desplaçament:** comprovar que els marcadors es mantenen ancorats en el mateix vas en ampliar, reduir, recentrar i canviar la mida de la finestra.
- [ ] **Feedback:** l'encert actual re-renderitza la fase i pot reiniciar l'ampliació. Afegir una confirmació visual no intrusiva abans de canviar la disposició, preservar zoom quan sigui raonable i suport a `prefers-reduced-motion`.
- [ ] **Navegació:** el banc d'etiquetes no ha d'amagar els controls de següent nivell. Indicar clarament nombre de pendents i estat dels vasos.
- [ ] **Contrast:** verificar WCAG AA per noms, marcadors, missatges i estats de focus; no dependre només del vermell/blau.

### P2 — Poliment visual

- [ ] Consolidar les **quatre capes d'estils** del fitxer `index.html` en un CSS coherent amb variables de disseny.
- [ ] Substituir miniatures de baixa resolució per recursos nítids que no perdin llegibilitat a 2×–3.5×.
- [ ] Revisar animacions d'encert/error, transicions, sons opcionals i microinteraccions sense alentir l'activitat.
- [ ] Aplicar el mateix sistema de components visuals a login, test, 3D i resum.

## Especificació d'usabilitat desktop/laptop

### Distribució suggerida

- **Desktop (≥ 1366 px):** dos panells simultanis. Atlas ampli i dominant (aprox. 60–65% de l'amplada disponible), etiquetes a la dreta (35–40%). Header amb email, fase, punts, ratxa i progrés.
- **Laptop 1280×720:** evitar que la capçalera i el banc ocultin el dibuix. Panell d'etiquetes amb scroll independent. Controls de zoom sempre visibles.
- **Laptop 1366×768:** comprovar una sessió real sencera sense scroll horitzontal i amb marcadors clicables.
- **Desktop 1440×900 i 1920×1080:** garantir que els vasos i etiquetes no quedin excessivament petits; aprofitar espai amb zoom adequat.
- **Pantalles amb escalat 125% i 150%:** provar que no hi ha solapaments, retalls ni pèrdua de punts.
- **Tablet i mòbil:** ús secundari; mantenir clic en dues passes com a alternativa a drag-and-drop.

### Matriu mínima de proves

| Escenari | Resultat esperat |
| --- | --- |
| 1280×720, zoom navegador 100% | Sense scroll horitzontal; tots els controls accessibles |
| 1366×768, 100% i 125% | Mapa estable; les etiquetes no tapen el contingut |
| 1440×900, 100% | Panells equilibrats; noms llegibles a distància |
| 1920×1080, 100% i 150% | Contingut centrat, no estirat; punts precisos |
| Zoom del mapa 1×, 2×, 3× | Cada marcador continua sobre el vas correcte |
| Roda del ratolí i touchpad | Zoom controlable sense desplaçaments imprevisibles |
| Arrossegar una resposta | Encert/errada correctament registrats |
| Seleccionar nom + clicar marcador | Mateixa valoració que amb drag-and-drop |
| Aconseguir 3 encerts seguits | Bonus +15, una sola vegada per cada triple |
| Cometre un error i usar una pista | −3 o −5, ratxa reiniciada |
| Acabar cada nivell | Exactament una resposta per marcador i habilitació de següent |
| Recarregar i recuperar progrés | Persistència correcta al mateix navegador |
| Canviar d'ordinador | No esperar sincronització: informar clarament |

**Criteri d'acceptació:** cap error bloquejant P0; un docent valida els 76 punts en les seves làmines; totes les combinacions de resolució i interacció passen la prova; cap número/etiqueta revela la resposta; es completa una partida de prova sense bloquejos.

## Recomanació de refactorització

Crear una configuració per nivell amb `asset`, `viewBox`/regió, `targets: [{id, acceptedNames, x, y}]` i un banc d'opcions **remenant les etiquetes**, independent de l'ordre dels marcadors. En lloc de mapes globals de noms, usar coordenades explícites per cada il·lustració. Separar CSS a `styles.css`; afegir un mode docent de calibratge de punts que no sigui accessible com a solució per l'alumne.

## Evidència necessària per tancar el punt

Per cada nivell: nom de la làmina i resolució; taula vaso→coordenada revisada; captura desktop amb els marcadors; llista de proves superades i nom/rol de la persona que valida. Sense aquestes evidències, **no marcar l'auditoria anatòmica com a finalitzada**.
