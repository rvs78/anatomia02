"""Genera els atles del joc i les seves coordenades a partir de les làmines del RA2.

Font: diapositiva «Atles Vascular del Cos Humà» (pàg. 56) de la presentació
«RA2.2. Vasos Sanguinis i Circulació (redisseny)».

Entrada: assets/src/atlas_art.png i assets/src/atlas_ven.png (meitat esquerra i
dreta de la diapositiva, sense rètols). Si no existeixen, es fan servir els
WebP actuals d'assets/. Funciona a qualsevol resolució: quan es disposi de la
diapositiva exportada en alta resolució, n'hi ha prou amb desar-la a assets/src
i tornar a executar:

    python3 scripts/build_atlas.py

Sortides:
    assets/atlas_art.webp, assets/atlas_ven.webp  (sense els claudàtors dels rètols)
    atlas-data.js                                 (coordenades detectades + clau)
    docs/validacio/atlas_*.png                    (evidència visual per al docent)

La detecció és automàtica: punts negres = vas assenyalat; claudàtors = rètol.
Cada claudàtor s'associa al punt pel traç de la línia guia (assignació òptima).
La clau de noms (ordre dels rètols de dalt a baix a cada costat) és la de la
diapositiva original amb rètols.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage
from scipy.optimize import linear_sum_assignment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Clau oficial: rètols de la diapositiva 56, de dalt a baix.
KEY = {
    "art": {
        "L": ["Caròtida comuna", "Arc aòrtic", "Axil·lar", "Aorta toràcica", "Aorta abdominal",
              "Ilíaca comuna", "Radial", "Femoral", "Tibial anterior"],
        "R": ["Subclàvia", "Braquial", "Tronc celíac", "Renal", "Cubital", "Ilíaca externa",
              "Poplítia", "Tibial posterior", "Pèdia"],
    },
    "ven": {
        "L": ["Jugular interna", "Subclàvia", "Cava superior", "Cefàlica", "Cava inferior",
              "Ilíaca comuna", "Femoral", "Tibial anterior", "Arc venós dorsal"],
        "R": ["Jugular externa", "Braquiocefàlica", "Basílica", "Renal", "Mitjana del colze",
              "Poplítia", "Safena magna"],
    },
}
MIN_FIT = 0.75  # proporció mínima de píxels de línia al llarg del traç


def load(system):
    src = os.path.join(ROOT, "assets", "src", f"atlas_{system}.png")
    if not os.path.exists(src):
        src = os.path.join(ROOT, "assets", f"atlas_{system}.webp")
    return Image.open(src).convert("RGB"), src


def detect(img):
    a = np.asarray(img).astype(int)
    h, w = a.shape[:2]
    s = w / 512  # escala relativa a la referència de 512 px
    g = a.mean(2)
    sat = a.max(2) - a.min(2)
    # Punts: taques gairebé negres i petites
    lab, _ = ndimage.label(g < 70)
    dots = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if 3 * s <= hh <= 9 * s and 3 * s <= ww <= 9 * s and (lab[sl] == i).sum() >= 8 * s * s:
            cy, cx = ndimage.center_of_mass(lab == i)
            dots.append((cx, cy))
    # Claudàtors: traços verticals grisos a les bandes laterals
    line = (g < 175) & (sat < 40)
    brackets = []
    for side, (x0, x1) in {"L": (0.23, 0.31), "R": (0.69, 0.77)}.items():
        x0, x1 = int(x0 * w), int(x1 * w)
        xb = x0 + int(np.argmax(line[:, x0:x1].sum(0)))
        band = max(1, int(round(s)))
        v = line[:, xb - band:xb + band + 1].any(1)
        lab2, k = ndimage.label(v)
        for j in range(1, k + 1):
            yy = np.where(lab2 == j)[0]
            if len(yy) >= 10 * s:
                brackets.append({"side": side, "x": xb, "y0": yy[0], "y1": yy[-1], "y": (yy[0] + yy[-1]) / 2})
    return dots, brackets, line


def trace_fit(line, b, d, s):
    h, w = line.shape
    xs = b["x"] + (4 * s if b["side"] == "L" else -4 * s)
    t = np.linspace(0.05, 0.95, 120)
    px, py = xs + (d[0] - xs) * t, b["y"] + (d[1] - b["y"]) * t
    hit = np.zeros(len(t), bool)
    for dy in (-1, 0, 1):
        hit |= line[np.clip((py + dy * s).round().astype(int), 0, h - 1),
                    np.clip(px.round().astype(int), 0, w - 1)]
    return hit.mean()


def erase_brackets(img, brackets):
    """Esborra els claudàtors (els substitueixen les caselles del joc) i conserva les línies."""
    out = img.copy()
    draw = ImageDraw.Draw(out)
    a = np.asarray(img)
    w = img.width
    pad = max(2, int(w / 512 * 3))
    for b in brackets:
        bg = tuple(int(c) for c in a[int(b["y"]), int(b["x"] + (-10 if b["side"] == "L" else 10) * w / 512)])
        if b["side"] == "L":
            box = (b["x"] - 8 * pad, b["y0"] - pad, b["x"] + pad, b["y1"] + pad)
        else:
            box = (b["x"] - pad, b["y0"] - pad, b["x"] + 8 * pad, b["y1"] + pad)
        draw.rectangle(box, fill=bg)
    return out


def main():
    result = {}
    os.makedirs(os.path.join(ROOT, "docs", "validacio"), exist_ok=True)
    for system in ("art", "ven"):
        img, src = load(system)
        w, h = img.size
        s = w / 512
        dots, brackets, line = detect(img)
        names = KEY[system]["L"] + KEY[system]["R"]
        if len(dots) != len(names) or len(brackets) != len(names):
            sys.exit(f"{system}: {len(dots)} punts i {len(brackets)} claudàtors; se n'esperaven {len(names)}")
        brackets.sort(key=lambda b: (b["side"], b["y"]))
        cost = np.array([[-trace_fit(line, b, d, s) for d in dots] for b in brackets])
        rows, cols = linear_sum_assignment(cost)
        targets = []
        per_side = {"L": 0, "R": 0}
        for r, c in zip(rows, cols):
            b, d = brackets[r], dots[c]
            fit = -cost[r, c]
            if fit < MIN_FIT:
                sys.exit(f"{system}: línia guia poc clara ({fit:.2f}) per al claudàtor {b}")
            name = KEY[system][b["side"]][per_side[b["side"]]]
            per_side[b["side"]] += 1
            targets.append({
                "id": f"{system}-{len(targets) + 1:02d}",
                "name": name,
                "side": b["side"],
                "slotY": round(100 * b["y"] / h, 2),
                "slotX": round(100 * b["x"] / w, 2),
                "x": round(100 * d[0] / w, 2),
                "y": round(100 * d[1] / h, 2),
                "fit": round(float(fit), 2),
            })
        clean = erase_brackets(img, brackets)
        # Unifica el fons dels marges (on van les caselles) a blanc pur, sense tocar les línies guia
        arr = np.asarray(clean).copy()
        xl = int(max(b["x"] for b in brackets if b["side"] == "L") + 6 * s)
        xr = int(min(b["x"] for b in brackets if b["side"] == "R") - 6 * s)
        for sl in (np.s_[:, :xl], np.s_[:, xr:]):
            m = arr[sl].min(2) > 222
            arr[sl][m] = 255
        arr[arr.min(2) > 242] = 255  # fons quasi blanc de tota la làmina
        clean = Image.fromarray(arr)
        if w < 1000:  # suavitza l'ampliació de les miniatures; no hi afegeix detall anatòmic
            clean = clean.resize((w * 2, h * 2), Image.LANCZOS).filter(
                ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        out = os.path.join(ROOT, "assets", f"atlas_{system}.webp")
        clean.save(out, "WEBP", quality=94, method=6)
        result[system] = {"src": f"./assets/atlas_{system}.webp", "w": clean.width, "h": clean.height,
                          "targets": targets}
        # Evidència de validació
        ev = img.resize((w * 2, h * 2), Image.LANCZOS) if w < 1000 else img.copy()
        k = ev.width / 100, ev.height / 100
        dr = ImageDraw.Draw(ev)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", max(12, int(ev.width / 75)))
        except OSError:
            font = ImageFont.load_default()
        for t in targets:
            x, y = t["x"] * k[0], t["y"] * k[1]
            dr.ellipse((x - 9, y - 9, x + 9, y + 9), outline=(230, 140, 0), width=3)
            tx = t["slotX"] * k[0] + (-8 if t["side"] == "L" else 8)
            anchor = "rm" if t["side"] == "L" else "lm"
            dr.text((tx, t["slotY"] * k[1]), f'{t["name"]} ({t["fit"]:.2f})', fill=(20, 20, 20), font=font, anchor=anchor)
        ev.save(os.path.join(ROOT, "docs", "validacio", f"atlas_{system}.png"))
        print(system, "font:", os.path.relpath(src, ROOT), "→", len(targets), "objectius; ajust mínim",
              min(t["fit"] for t in targets))
    js = ("// Fitxer generat per scripts/build_atlas.py — no l'editeu a mà.\n"
          "// Coordenades en % de la làmina; slotX/slotY = claudàtor original; x/y = punt del vas.\n"
          "export const ATLAS = " + json.dumps(result, ensure_ascii=False, indent=1) + ";\n")
    open(os.path.join(ROOT, "atlas-data.js"), "w", encoding="utf-8").write(js)


if __name__ == "__main__":
    main()
