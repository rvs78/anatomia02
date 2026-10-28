# Estat del projecte i tasques pendents — Vascular Quest RA2

**Data de revisió:** 28/10/2026. **Font:** lectura de `README.md`, `index.html`, `game.js`, `data.js`, recursos gràfics i workflow a la branca `main`.

## Estat implementat

| Component | Estat verificat al codi | Limitacions |
| --- | --- | --- |
| Inici i accés | Formulari @isvh.cat + contrasenya compartida | No hi ha autenticació institucional |
| Fase 1 | 9 nivells, 76 posicions totals, arrossegar/deixar anar, clics, zoom, pistes, punts | Coordenades provisionals i filtració de respostes pels números |
| Atles arterial i venós | Fitxers WebP publicats a `assets/` | Qualitat de detall i retalls pendents d'auditoria |
| Fase 2 | 20 preguntes i correcció després de respondre | Sense aleatorització ni banc ampliat |
| Fase 3 | Three.js, 30 punts, rotació, zoom i text | Anatomia esquemàtica, punts per índex i possibles duplicats |
| Puntuació | +10 / −3 / −5 / +15 per tres encerts, comptadors | Sense registre servidor ni verificació |
| Persistència | `localStorage` del navegador | Sense sincronització entre dispositius |
| Informe final | Resum HTML imprimible | El PDF no es genera com a adjunt automàtic |
| Email | `mailto:` al professor amb assumpte/cos | Cal adjuntar i enviar manualment |
| Drive/Sheets | Exclosos d'aquesta aplicació per decisió docent | Un altre agent/procés en gestiona el tractament |

**No hi ha evidència de proves de navegació completes en una aula real a desktop/laptop ni d'auditoria mèdica definitiva de tots els punts.**

## P0 — Prioritat crítica abans d'avaluació puntuable

- [ ] **Eliminar la filtració de respostes de la fase 1.** Actualment el número del botó d'etiqueta coincideix amb el del marcador correcte. Remenar les opcions i separar completament ID intern, ordre d'etiqueta i ordre visual.
- [ ] **Auditar cadascuna de les 76 col·locacions sobre l'atles original.** Validar posicions sobre vasos correctes, artèries/venes homònimes i possibles estructures absents. No donar un punt anatòmic per correcte només perquè la lògica d'índex coincideix.
- [ ] **Revisar específicament la precisió/escala CSS de l'atles.** Hi ha diverses capes CSS a `index.html` i un retall visual en lloc d'una imatge neta perfectament calibrada; assegurar que `vascularPositions` s'aplica sobre el mateix sistema de coordenades.
- [ ] **Passar una partida de prova completa** en un ordinador real des de login fins a informe, a les resolucions especificades a l'auditoria.
- [ ] **Revisar la fase 3 abans de qualificar:** 30 punts i etiquetes han de correspondre a vasos anatòmicament demostrables. Actualment les coordenades 3D són esquemàtiques i la selecció de vasos pot incloure duplicats.

## P1 — Millores d'experiència de joc i entrega

- [ ] Dissenyar un panell d'etiquetes que no sature els nivells 5 i 9 i mantingui el mapa visible.
- [ ] Proves de zoom, pan, drag-and-drop, trackpad i clic en dues etapes a 1280×720, 1366×768, 1440×900 i 1920×1080, incloent escalat 125–150%.
- [ ] Afegir focus visible, ús per teclat, contrast verificat, instruccions curtes i indicadors accessibles.
- [ ] Aleatorització de preguntes/etiquetes mantenint respostes correctes i progressos coherents.
- [ ] Ampliar el diccionari de sinònims català/castellà de la fase 3 amb una llista revisada per docents.
- [ ] Millorar la pantalla final perquè el PDF inclogui identificació, punts per fase, errors, pistes, temps de resolució i resum de logros.
- [ ] Si es vol un sol botó «Envia al professor» que adjunti el PDF automàticament, **implementar un servei de correu autoritzat**. GitHub Pages i `mailto:` no poden garantir adjunts automàtics.

## P2 — Evolució i manteniment

- [ ] Consolidar CSS i components amb un sistema visual únic a totes les fases.
- [ ] Substituir o millorar atles de baixa resolució; fer servir fonts d'alta qualitat amb permís de reutilització.
- [ ] Separar dades anatòmiques, coordenades, puntuació i interfície per facilitar manteniment i proves.
- [ ] Afegir proves automatitzades: coherència de noms, coordenades, 1:1 de marcadors/etiquetes, validació de nivells i persistència.
- [ ] Fer captacions de pantalla comparables entre versions per detectar regressions en zoom i responsive.
- [ ] **Refactoritzar `scripts/import_ra2_canva.py` / GitHub Action**: les URLs de Canva signades poden expirar i el procés pot substituir els atles WebP preparats manualment. No reexecutar sense revisar.
- [ ] Documentar autorització de reutilització de les imatges de la presentació i condicions de publicació en repositori públic.

## Definició de feina finalitzada (DoD)

Només considerar «llest per a ús puntuable» quan es compleixen **tots** els criteris:

1. Identificació correcta de tots els marcadors, amb validació anatòmica i evidències.
2. Cap pista accidental pels números, ordre del banc, text de la imatge o codi d'interacció.
3. Test complet a escriptori i portàtil en resolucions i navegadors indicats, sense bloquejos.
4. Puntuació i persistència coherents després de recàrregues i errors.
5. 3D correcte per als 30 punts, sense duplicitats no intencionades ni posicions fictícies puntuables.
6. Informe PDF clar i ruta de lliurament definida, sense afirmar que el correu s'ha enviat si només s'ha obert `mailto:`.
7. Desplegament final verificat i instruccions per al professorat i l'alumnat actualitzades.

## Proper ordre de treball proposat

**Primer:** arreglar filtració de números i revisar els 76 punts amb làmines de qualitat. **Després:** UI responsive i proves desktop/laptop. **Finalment:** model 3D, diccionari d'acceptació, informe i proves de regressió de punta a punta.

Per al detall del protocol de pantalles, consulta [FASE1_GRAFICS_I_USABILITAT.md](FASE1_GRAFICS_I_USABILITAT.md).
