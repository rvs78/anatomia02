# Vascular Quest · Anatomia Humana RA2

Aplicació web en català per al CFGS d'Anatomia Patològica i Citodiagnòstic (mòdul d'Anatomia Humana). L'alumnat identifica artèries i venes **sobre la mateixa làmina que es treballa a classe**: la diapositiva «Atles Vascular del Cos Humà» de la presentació *RA2.2. Vasos Sanguinis i Circulació (redisseny)*.

Té forma d'**àlbum de cromos**: cada nivell és una pàgina i cada nom és un cromo que s'enganxa al seu forat, amb animacions i sons en encerts, errors i ratxes, i un sobre d'instruccions amb vídeo al començament de cada fase. Disseny i moviment: [DESIGN.md](DESIGN.md).

**Accés:** https://rvs78.github.io/anatomia02/

## Recorregut

| Fase | Què es fa | Abast |
| --- | --- | --- |
| **1 · Atles** | Arrossegar (o tocar i col·locar) cada nom a la seva casella o al seu punt, com a la làmina d'examen | 9 nivells: 4 regionals + repte arterial (18 vasos) i 3 regionals + repte venós (16 vasos) |
| **2 · Test** | 20 preguntes triades a l'atzar d'un banc de 44, opcions barrejades i explicació després de cada resposta | Contingut del PDF del RA2.2 |
| **3 · Mapa mut** | Escriure el nom del vas assenyalat a la làmina (2 intents, inicials com a pista) | 24 vasos a l'atzar (12 artèries + 12 venes) |
| **Informe** | Punts per fase, estrelles i temps per nivell, llista de repàs; PDF des del navegador i correu preparat | — |

**Puntuació:** +10 encert · −3 error · −5 pista · +15 per cada 3 encerts seguits. La puntuació no baixa de 0.

**So:** efectes curts sintetitzats al navegador, activats per defecte i amb botó de silenci a la capçalera.

## Exactitud anatòmica

Els punts de joc **no es col·loquen a mà**: `scripts/build_atlas.py` detecta a la làmina els punts negres i els claudàtors dels rètols, associa cada claudàtor amb el seu punt resseguint la línia guia i hi aplica la clau oficial de rètols de la diapositiva 56. El resultat és `atlas-data.js`. L'evidència visual per al docent és a [`docs/validacio/`](docs/validacio/).

## Documentació

- [Guia de l'alumnat](docs/GUIA_DEL_JOC.md)
- [Arquitectura i funcionament](docs/ARQUITECTURA_I_FUNCIONAMENT.md)
- [Fase 1: gràfics, coordenades i usabilitat](docs/FASE1_GRAFICS_I_USABILITAT.md)
- [Estat i pendents](docs/ESTAT_I_PENDENTS.md)

## Desenvolupament

```bash
python3 -m http.server 8000      # obre http://localhost:8000
node tests/check.mjs             # coherència de dades, clau i puntuació (també a GitHub Actions)
python3 tests/e2e.py             # partida completa amb Playwright i captures a 5 resolucions
python3 scripts/build_atlas.py   # regenera atles i coordenades des d'assets/src/
cd video && npm i && npm run render   # regenera el vídeo «Com es juga» (Remotion)
```

Accés: correu `@isvh.cat` i contrasenya comuna d'aula. És una barrera d'entrada, no una autenticació. El progrés es desa al `localStorage` del navegador.
