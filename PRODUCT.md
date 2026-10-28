# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alumnat del CFGS d'Anatomia Patològica i Citodiagnòstic (mòdul optatiu MO1 Anatomia humana, Catalunya), adults. Juguen al seu ordinador o portàtil a l'aula, amb ratolí o trackpad, i també a casa com a repàs, de vegades des de mòbil o tauleta. El professor (especialitat 518, Processos Sanitaris) revisa l'informe final que li envien.

## Product Purpose

Que l'alumnat reconegui les artèries i venes principals del RA2 sobre la mateixa làmina que es treballa a classe, i en consolidi el coneixement amb un test i un mapa mut. Èxit: localitzar cada vas sense pistes i arribar a l'informe amb poques errades.

## Positioning

La làmina de joc és la diapositiva oficial «Atles Vascular del Cos Humà» del RA2.2, amb els punts i les caselles derivats de la clau de rètols original: el que es juga és exactament el que entra a l'examen.

## Operating Context

- Sessions a classe de 20–40 minuts i repàs a casa sense supervisió.
- Material font: presentació «RA2.2. Vasos Sanguinis i Circulació (redisseny)» (Canva `DAHYn8UO7FY`, PDF a Drive) publicada a Google Classroom.
- Lliurament: PDF de l'informe adjuntat a mà a un correu al professor.

## Capabilities and Constraints

- Web estàtica a GitHub Pages; HTML, CSS i JavaScript sense dependències d'execució.
- Interfície en català. Accés amb correu `@isvh.cat` i contrasenya d'aula; progrés a `localStorage`.
- Tres fases (Atles, Test, Mapa mut) i informe. Puntuació: +10, −3, −5, +15 per cada 3 seguits.
- Exactitud anatòmica innegociable: les coordenades surten de `scripts/build_atlas.py`, mai a mà.
- Sons curts en encerts i errors, activats per defecte i amb botó de silenci (confirmat pel docent, 28/10/2026).

## Brand Commitments

- Nom: Vascular Quest · RA2. Codi de color anatòmic: vermell = artèria, blau = vena.

## Evidence on Hand

- `assets/src/atlas_art.png`, `assets/src/atlas_ven.png`: làmines font (512 px d'amplada).
- `docs/validacio/`: evidència de la clau. No existeixen resultats d'alumnat ni testimonis; no s'han d'inventar.

## Product Principles

1. L'anatomia mana: cap efecte pot tapar, desplaçar o distorsionar la làmina ni els punts.
2. El joc premia saber, no endevinar: cap pista involuntària a la interfície.
3. Cada acció té resposta immediata i clara (encert, error, pista), visual i sonora.
4. Ha de funcionar igual a l'aula i a casa, amb ratolí, trackpad, tàctil o teclat.

## Accessibility & Inclusion

Contrast WCAG AA, ús complet amb teclat, `prefers-reduced-motion` respectat i el color mai com a únic senyal (vermell/blau sempre acompanyats de text).
