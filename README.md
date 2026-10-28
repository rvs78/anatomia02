# Vascular Quest · Anatomia Humana RA2

**Aplicació web educativa en català** per al CFGS d'Anatomia Patològica i Citodiagnòstic. Projecte vinculat a **EDU 518 OS**.

**Accés:** https://rvs78.github.io/anatomia02/ · **Font docent:** *RA2.2. Vasos Sanguinis i Circulació (redisseny)* (Canva / PDF del mòdul).

## Què és?

Un joc d'identificació vascular i repàs de la circulació sanguínia. El recorregut té **3 fases consecutives** amb puntuació, penalitzacions i bonus:

| Fase | Funcionament | Abast actual |
| --- | --- | --- |
| **1 · Atles vascular** | Arrossegar noms o seleccionar-los i col·locar-los en marcadors dels atlas d'artèries/venes; zoom, desplaçament i pistes | **9 nivells:** 5 arterials + 4 venosos; **76 col·locacions** totals (hi ha vasos repetits) |
| **2 · Test** | Preguntes una a una, 4 opcions, 1 resposta correcta | **20 preguntes** |
| **3 · Explorador 3D** | Cos esquemàtic giratori amb punts vermells/blaus i resposta escrita | **30 punts** |
| **Final** | Resum de punts, encerts, errors i pistes; impressió a PDF i correu preparat | PDF via navegador i **adjunt manual** al correu |

### Mecànica de punts

**+10** per encert, **−3** per error, **−5** per pista i **+15** per cada **3 encerts seguits**. La puntuació no baixa de 0.

### Login i dades

Es permet un correu acabat en `@isvh.cat` i una **contrasenya comuna d'aula**. La validació és local, no autentica comptes institucionals. El progrés es desa a **`localStorage` del navegador**, no en un servidor. No hi ha connexió directa amb Drive, Classroom ni Sheets.

## Documentació del projecte

- **[Guia de l'alumnat i funcionament del joc](docs/GUIA_DEL_JOC.md)** — accés, instruccions de cada fase, controls, punts, PDF i lliurament.
- **[Especificació tècnica i arquitectura](docs/ARQUITECTURA_I_FUNCIONAMENT.md)** — fitxers, dades, estat, model 3D, implantació i manteniment.
- **[Fase 1: gràfics, punts anatòmics i resolucions](docs/FASE1_GRAFICS_I_USABILITAT.md)** — auditoria, problemes detectats, criteris d'acceptació i pla de proves desktop/laptop.
- **[Estat real i treball pendent](docs/ESTAT_I_PENDENTS.md)** — prioritats P0/P1/P2, limitacions i definició de fet.

## Fitxers principals

`index.html` (interfície i estils), `game.js` (lògica), `data.js` (nivells i qüestionari), `assets/` (atles), `scripts/` i `.github/workflows/` (importació d'imatges).

### Estat de qualitat · 28/10/2026

**El joc està publicat però encara no està certificat per a avaluació oficial.** Cal corregir la correspondència visible número-etiqueta de la fase 1, validar totes les coordenades anatòmiques amb les làmines, provar la interfície a ordinador real i elevar la qualitat/resolució dels gràfics. El 3D és esquemàtic, no un model anatòmic precís; l'enviament del PDF no és automàtic. La documentació manté aquests pendents explícits perquè no es confonguin amb funcions acabades.
