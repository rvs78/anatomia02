# Estat del projecte i pendents — Vascular Quest RA2

**Revisió:** 28/10/2026 · versió 5.

## Estat

| Component | Estat | Limitació |
| --- | --- | --- |
| Entrada | Correu `@isvh.cat` + contrasenya d'aula | No és autenticació real |
| Fase 1 · Atles | 9 nivells sobre la làmina oficial; caselles i punts exactes; arrossegar, tocar o teclat; zoom ancorat; estrelles i temps per nivell | Làmines a resolució mitjana |
| Fase 2 · Test | 20 de 44 preguntes, opcions barrejades, explicacions | — |
| Fase 3 · Mapa mut | 24 vasos reals a l'atzar, sinònims i tolerància a una errada | — |
| Informe | Punts per fase, taula de nivells, llista de repàs, PDF i `mailto:` | El PDF s'adjunta a mà |
| Persistència | `localStorage` (v5) | Sense sincronització entre dispositius |
| Qualitat | 328 comprovacions automàtiques (CI) + partida completa amb Playwright a 5 resolucions | — |

## P0 abans d'usar-lo amb nota

- [x] Eliminar la filtració de respostes per números.
- [x] Coordenades exactes de tots els vasos, derivades de la làmina i de la clau oficial.
- [x] Un sol sistema de coordenades per a imatge, caselles i punts.
- [x] Partida completa sense errors en navegador.
- [x] Substituir el 3D esquemàtic per una prova sobre vasos reals.
- [ ] Validació del docent de `docs/validacio/` (revisar i signar).

## P1

- [ ] Làmines en alta resolució (veure FASE1).
- [ ] Prova en aula amb trackpads reals i escalat 125–150 %.
- [ ] Ampliar `SYNONYMS` amb les variants que l'alumnat escrigui de veritat (revisar informes).
- [ ] Si es vol enviar l'informe sense passos manuals, cal un servei de correu o un formulari institucional; GitHub Pages no pot adjuntar fitxers.

## P2

- [ ] Mode estudi (làmina amb rètols) abans de cada nivell, sense punts.
- [ ] Nivells de branques (tronc braquiocefàlic, mesentèriques, polígon de Willis) si es preparen làmines amb punts i rètols com la diapositiva 56.
- [ ] Documentar el permís de reutilització de les il·lustracions de la presentació en un repositori públic.

## Definició de fet

Ús qualificable quan: (1) el docent valida les làmines de `docs/validacio/`; (2) `node tests/check.mjs` passa; (3) `tests/e2e.py` completa la partida; (4) s'ha provat en un ordinador de l'aula.
