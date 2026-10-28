# Fase 1 — Gràfics, coordenades i usabilitat

**Actualització:** 28/10/2026 (versió 5).

## Font gràfica

- Diapositiva 56, «Atles Vascular del Cos Humà», de *RA2.2. Vasos Sanguinis i Circulació (redisseny)* (Canva `DAHYn8UO7FY`; PDF a Drive).
- La diapositiva conté la clau oficial: 18 rètols arterials i 16 de venosos, cadascun unit per una línia guia a un punt negre.
- Les làmines del joc són aquestes dues meitats sense rètols. Les altres miniatures regionals que hi havia a `assets/` s'han retirat: eren retalls de baixa resolució amb rètols visibles i no s'usaven.

## Auditoria de punts: resolta

| Incidència anterior | Estat |
| --- | --- |
| Números del banc iguals als dels marcadors (filtració de respostes) | **Resolt.** El banc no té números; els noms es barregen i l'ordre queda fixat per sessió |
| Coordenades estimades a mà (`vascularPositions`) | **Resolt.** Coordenades detectades automàticament dels punts de la làmina i associades a la clau per la línia guia |
| Retall CSS de la imatge (`left:-66%`, `width:233%`) | **Resolt.** La imatge es mostra sencera; caselles, punts i línies comparteixen el mateix sistema de coordenades |
| Variants arterials/venoses amb sufix «(vena)» | **Resolt.** Cada sistema té la seva làmina i els seus ids (`art-…`, `ven-…`) |
| Vasos que no surten a la làmina | **Resolt.** Els nivells només poden usar noms de la clau; ho comprova `tests/check.mjs` |
| Re-render en encertar que reiniciava el zoom | **Resolt.** L'encert actualitza només la casella i la línia |

Evidència: `docs/validacio/atlas_art.png` i `atlas_ven.png` (cada nom sobre el seu punt, amb l'ajust de la línia guia entre parèntesis). Ajust mínim: 0,82 (artèries) i 0,89 (venes).

## Proves fetes (Playwright, Chromium 153)

| Escenari | Resultat |
| --- | --- |
| 1280×720, 1366×768, 1440×900, 1920×1080 | Sense scroll horitzontal; 0 caselles solapades |
| 390×844 (mòbil) | Sense scroll horitzontal; làmina a dalt i panell a sota |
| Arrossegar un nom fins a la casella | Encert registrat (+10) |
| Tocar nom + casella equivocada | Error registrat (−3), ratxa a 0 |
| Pista amb nom triat | Casella i punt en ocre, −5 |
| Ampliar amb la roda sobre un vas i clicar-ne el punt | Encert registrat; els punts segueixen ancorats |
| 9 nivells, 20 preguntes i 24 vasos del mapa mut | Partida completa fins a l'informe sense errors de consola |

## Pendent

- **Resolució de les làmines.** Les fonts actuals són de 512 px d'amplada (ampliades a 1024 px amb suavitzat). Es veuen bé a 1× i correctes a 2×; per a 3× convé la diapositiva exportada en alta resolució. El connector de Canva no permet exportar aquest disseny i el PDF de Drive (23 MB) supera el límit de descàrrega del connector. Quan es tingui la imatge: desar-la a `assets/src/` i executar `python3 scripts/build_atlas.py` (el procés és independent de la resolució).
- **Prova en aula real** amb trackpads i escalat del sistema al 125–150 %.
- **Validació docent** de les dues làmines de `docs/validacio/` (signatura i data).
