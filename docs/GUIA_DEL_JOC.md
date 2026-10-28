# Guia de joc — Vascular Quest RA2

> **Idioma de l'aplicació:** català. **Destinataris:** alumnat de CFGS d'Anatomia Patològica i Citodiagnòstic, mòdul d'Anatomia Humana. **Última revisió documental:** 28/10/2026.

## Objectiu i accés

**Vascular Quest** és un joc per reconèixer els principals vasos sanguinis i aplicar continguts del **RA2: Vasos sanguinis i circulació**.

- Web: https://rvs78.github.io/anatomia02/
- Correu d'accés: un correu amb el domini `@isvh.cat`.
- Contrasenya: la contrasenya comuna facilitada pel professorat (`alumnesap` al codi actual).
- Recomanació: ordinador o portàtil, navegador modern, ratolí o trackpad i connexió a Internet.

**Important:** l'accés no comprova que l'alumne sigui realment el titular del correu. El progrés es desa a l'emmagatzematge local **d'aquell navegador i dispositiu**, no al compte de Google ni a cap servidor. No es garanteix que continuï disponible si es canvia d'ordinador, es fa servir el mode privat o s'esborren les dades del navegador.

## Itinerari

| Fase | Activitat | Contingut actual |
| --- | --- | --- |
| 1. Atles vascular | Relacionar el nom amb un marcador anatòmic | **9 nivells, 76 col·locacions** en total; hi ha vasos repetits en diferents nivells |
| 2. Test vascular | Seleccionar una única resposta entre quatre | **20 preguntes**, una a una |
| 3. Explorador 3D | Girar el cos i escriure el nom del vas indicat | **30 punts**, model 3D esquemàtic |
| Final | Consultar resultats, desar-los i preparar l'enviament | Resum imprimible i acció `mailto:` |

### Fase 1 — Atles vascular

1. Observa si el nivell és d'**artèries** o de **venes** i llegeix-ne el títol.
2. Consulta el dibuix a l'esquerra i el banc de noms a la dreta (en vista d'escriptori).
3. **Arrossega** un nom fins al marcador anatòmic que consideris correcte. També pots **clicar el nom i després el marcador**.
4. Si l'encertes, s'indica com a resolt i el nom desapareix del banc de respostes; si falles, pots tornar-ho a provar.
5. Utilitza els botons **+**, **−** i **⤢** per ampliar, reduir i centrar. La roda del ratolí també canvia el zoom i, quan està ampliat, pots arrossegar el fons.
6. El botó **Pista** identifica un dels marcadors encara pendents, a canvi de punts.
7. Has d'encertar totes les posicions del nivell per activar **Següent nivell**.

Els nivells són progressius: tronc i coll arterial; cap i extremitat superior; abdomen i pelvis; extremitat inferior; repte arterial complet; retorn central i coll venós; extremitat superior venosa; abdomen i pelvis venosa; repte venós complet.

**Advertiment docent:** la fase 1 continua pendent de validació anatòmica i de proves d'usabilitat en ordinadors reals. La disposició actual és provisional; no s'ha d'usar encara com a prova qualificable oficial.

### Fase 2 — Test de coneixements

- Es mostren **20 preguntes** successives, amb **quatre alternatives**.
- Només una és correcta; després de respondre es veu el resultat i es pot continuar.
- La resposta no es pot canviar en la mateixa pregunta un cop confirmada.
- Continguts: paret vascular, doble circulació, principals vasos i retorn venós.

### Fase 3 — Explorador 3D

- Es representa un **model humà esquemàtic**, no un atles anatòmic clínicament exacte.
- Pots **girar-lo arrossegant** i **ampliar-lo amb la roda**.
- Els punts **vermells** representen artèries i els **blaus**, venes.
- Clica un punt, escriu el nom i prem **Comprova**.
- Es toleren **majúscules/minúscules** i **accents**. El sistema només inclou algunes equivalències terminològiques; **no accepta de manera exhaustiva tots els noms en castellà**.
- Si el motor 3D no es pot carregar, el codi inclou una llista alternativa numerada per seleccionar punts.

## Sistema de punts actual

| Acció | Puntuació |
| --- | ---: |
| Resposta correcta | **+10** |
| Resposta errònia | **−3** |
| Utilitzar una pista | **−5** |
| Cada **3 encerts seguits** | **+15** addicionals |

- La puntuació no baixa de zero amb les penalitzacions ordinàries.
- Un error o una pista trenca la ratxa.
- La ratxa és **global** entre fases, d'acord amb el codi actual.
- El recompte de `encerts` inclou identificacions de les fases 1 i 3 i preguntes de la fase 2.

## Informe final i lliurament

1. En acabar les tres fases, s'obre la pantalla de resum amb correu, puntuació, encerts, errors, pistes i resultats del test i del 3D.
2. Prem **Desa PDF** i, al diàleg d'impressió, tria **Desa com a PDF**.
3. Prem **Prepara correu al professor**: s'obre el programa de correu predeterminat, si està configurat.
4. **Adjunta manualment el PDF** i envia el missatge a `ruben.vallejo@isvh.cat`.

**No hi ha enviament automàtic del PDF ni sincronització amb Drive o Sheets.** El tractament de les entregues a Gmail/Drive correspon a un altre procés.

## Si hi ha un problema

- **No es veu l'atles:** recarrega la pàgina i comprova la connexió.
- **No pots col·locar una etiqueta:** prova el mètode de clic en nom + clic en marcador.
- **El dibuix queda descentrat:** prem **⤢**.
- **Un marcador sembla mal situat:** informa el professor; no interpretis una coordenada provisional com a referència anatòmica definitiva.
- **No apareix el PDF:** obre la impressió del navegador i selecciona **Desa com a PDF**.
- **No s'obre el correu:** adjunta el PDF manualment des del teu correu institucional.

Per a limitacions comprovades i criteris de qualitat, consulta [FASE1_GRAFICS_I_USABILITAT.md](FASE1_GRAFICS_I_USABILITAT.md) i [ESTAT_I_PENDENTS.md](ESTAT_I_PENDENTS.md).
