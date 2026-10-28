import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Tutorial «Com es juga» de Vascular Quest · RA2 (àlbum de cromos).
// Coordenades copiades d'atlas-data.js (generat per scripts/build_atlas.py).

const C = {
  cover: "#22194d",
  cover2: "#2f2466",
  page: "#f2b42c",
  dot: "#e2a015",
  paper: "#fffdf8",
  ink: "#1b1533",
  art: "#d7263d",
  foil: "#ffd86b",
  foilDeep: "#b88a00",
  err: "#c81e3a",
};
const DISPLAY = "BigShoulders, 'Arial Narrow', sans-serif";
const TEXT = "Atkinson, system-ui, sans-serif";

const FONTS = `
@font-face { font-family: BigShoulders; font-weight: 900; src: url(${staticFile("fonts/big-shoulders-display-latin-900-normal.woff2")}) format('woff2'); }
@font-face { font-family: BigShoulders; font-weight: 800; src: url(${staticFile("fonts/big-shoulders-display-latin-800-normal.woff2")}) format('woff2'); }
@font-face { font-family: Atkinson; font-weight: 700; src: url(${staticFile("fonts/atkinson-hyperlegible-latin-700-normal.woff2")}) format('woff2'); }
`;

// Làmina: 1024×1000 a 600 px d'amplada
const PL = { left: 70, top: 64, w: 600, h: 586 };
const px = (x: number) => PL.left + (x * PL.w) / 100;
const py = (y: number) => PL.top + (y * PL.h) / 100;
type T = { name: string; slotX: number; slotY: number; x: number; y: number };
const FEMORAL: T = { name: "Femoral", slotX: 27.93, slotY: 55.9, x: 45.43, y: 55.48 };
const ILIACA: T = { name: "Ilíaca comuna", slotX: 27.93, slotY: 41.5, x: 48.32, y: 40.92 };
type Full = T & { side: "L" | "R" };
const ALL: Full[] = [{"name":"Caròtida comuna","side":"L","slotX":27.93,"slotY":11.9,"x":48.51,"y":13.48},{"name":"Arc aòrtic","side":"L","slotX":27.93,"slotY":18.5,"x":50.71,"y":19.92},{"name":"Axil·lar","side":"L","slotX":27.93,"slotY":24.5,"x":42.11,"y":19.92},{"name":"Aorta toràcica","side":"L","slotX":27.93,"slotY":30.5,"x":49.49,"y":29.92},{"name":"Aorta abdominal","side":"L","slotX":27.93,"slotY":35.9,"x":49.53,"y":36.48},{"name":"Ilíaca comuna","side":"L","slotX":27.93,"slotY":41.5,"x":48.32,"y":40.92},{"name":"Radial","side":"L","slotX":27.93,"slotY":46.9,"x":37.03,"y":41.92},{"name":"Femoral","side":"L","slotX":27.93,"slotY":55.9,"x":45.43,"y":55.48},{"name":"Tibial anterior","side":"L","slotX":27.93,"slotY":73.9,"x":43.48,"y":73.92},{"name":"Subclàvia","side":"R","slotX":71.88,"slotY":16,"x":54.61,"y":17.48},{"name":"Braquial","side":"R","slotX":71.88,"slotY":25,"x":59.25,"y":25.92},{"name":"Tronc celíac","side":"R","slotX":71.88,"slotY":30.4,"x":49.92,"y":31.72},{"name":"Renal","side":"R","slotX":71.88,"slotY":36,"x":52.22,"y":34.48},{"name":"Cubital","side":"R","slotX":71.88,"slotY":41.4,"x":60.47,"y":41.92},{"name":"Ilíaca externa","side":"R","slotX":71.88,"slotY":47,"x":53.4,"y":43.92},{"name":"Poplítia","side":"R","slotX":71.88,"slotY":66,"x":54.22,"y":66.92},{"name":"Tibial posterior","side":"R","slotX":71.88,"slotY":76,"x":53.2,"y":75.92},{"name":"Pèdia","side":"R","slotX":71.88,"slotY":90,"x":53.83,"y":91.92}];
const SLOT_W = (23.6 * PL.w) / 100;
const SLOT_H = 34;
const slotBox = (t: T) => ({ right: px(t.slotX + 0.7), cy: py(t.slotY) });
const EmptySlot: React.FC<{ t: Full }> = ({ t }) => (
  <div style={{
    position: "absolute", top: py(t.slotY) - SLOT_H / 2, height: SLOT_H, width: SLOT_W,
    left: t.side === "L" ? px(t.slotX + 0.7) - SLOT_W : px(t.slotX - 0.7),
    borderRadius: 8, border: "2.5px dashed #a79fc9", background: "#f7f5ff",
  }} />
);
const slotCenter = (t: T) => ({ x: slotBox(t).right - SLOT_W / 2, y: slotBox(t).cy });

const PILE = {
  Femoral: { x: 930, y: 300 },
  Radial: { x: 1060, y: 380 },
  Braquial: { x: 900, y: 460 },
} as const;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const Cromo: React.FC<{ label: string; x: number; y: number; scale?: number; rotate?: number; wrong?: boolean; opacity?: number }> = ({
  label, x, y, scale = 1, rotate = 0, wrong, opacity = 1,
}) => (
  <div
    style={{
      position: "absolute", left: x, top: y, opacity,
      transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,
      padding: "16px 22px 16px 34px", borderRadius: 14, background: C.paper, color: C.ink,
      fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, lineHeight: 1, whiteSpace: "nowrap",
      boxShadow: `0 0 0 4px ${wrong ? C.err : "#fff"}, 0 18px 30px -10px rgba(0,0,0,.55)`, overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: C.art }} />
    {label}
  </div>
);

const Cursor: React.FC<{ x: number; y: number; down: boolean }> = ({ x, y, down }) => (
  <svg width={46} height={46} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${down ? 0.88 : 1})` }}>
    <path d="M4 2l15 9.5-6.7 1.4 3.9 7.3-3 1.6-3.9-7.4L4 19z" fill="#fff" stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

const Slot: React.FC<{ t: T; filled?: number; wrong?: number; shake?: number }> = ({ t, filled = 0, wrong = 0, shake = 0 }) => {
  const b = slotBox(t);
  return (
    <div
      style={{
        position: "absolute", left: b.right - SLOT_W + shake, top: b.cy - SLOT_H / 2, width: SLOT_W, height: SLOT_H,
        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 10px",
        fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, overflow: "hidden",
        border: filled ? "none" : `2.5px ${wrong ? "solid" : "dashed"} ${wrong ? C.err : "#a79fc9"}`,
        background: filled ? C.art : wrong ? "#fde1e5" : "#f7f5ff", color: "#fff",
        boxShadow: filled ? "0 0 0 3px #fff, 0 6px 12px -4px rgba(27,21,51,.5)" : "none",
        transform: `scale(${1 + 0.2 * Math.sin(Math.min(filled, 1) * Math.PI)})`,
      }}
    >
      {filled ? t.name : ""}
      {filled > 0 && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.6) 45%, transparent 60%)", transform: `translateX(${interpolate(filled, [0, 1], [-120, 120])}%)` }} />
      )}
    </div>
  );
};

const Float: React.FC<{ text: string; x: number; y: number; p: number; loss?: boolean }> = ({ text, x, y, p, loss }) => (
  <div style={{
    position: "absolute", left: x, top: y - 90 * p, opacity: interpolate(p, [0, 0.2, 0.75, 1], [0, 1, 1, 0]),
    transform: `translate(-50%,-50%) scale(${interpolate(p, [0, 0.3], [0.6, 1.1], { extrapolateRight: "clamp" })})`,
    fontFamily: DISPLAY, fontWeight: 900, fontSize: 72, color: loss ? "#ff9aa8" : C.foil,
    WebkitTextStroke: `3px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 5px 0 ${C.ink}`,
  }}>{text}</div>
);

export const Tutorial: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Escena 1: títol (0–54)
  const titleIn = spring({ frame: f, fps, config: { damping: 12 } });
  const titleOut = interpolate(f, [42, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  // Escena 2: encert (60–200)
  const fem0 = PILE.Femoral, femS = slotCenter(FEMORAL);
  const femMove = interpolate(f, [88, 122], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const femStick = f >= 124 ? interpolate(f, [124, 146], [0.01, 1], { extrapolateRight: "clamp" }) : 0;
  const femX = interpolate(femMove, [0, 1], [fem0.x, femS.x]);
  const femY = interpolate(femMove, [0, 1], [fem0.y, femS.y]) - Math.sin(femMove * Math.PI) * 60;
  const lineDraw = interpolate(f, [126, 146], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  // Escena 3: error (200–290)
  const rad0 = PILE.Radial, radT = slotCenter(ILIACA);
  const radGo = interpolate(f, [206, 236], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const radBack = interpolate(f, [252, 280], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const radX = interpolate(radGo, [0, 1], [rad0.x, radT.x]) + (radT.x - rad0.x) * -radBack;
  const radY = interpolate(radGo, [0, 1], [rad0.y, radT.y]) + (rad0.y - radT.y) * radBack - Math.sin(radBack * Math.PI) * 80;
  const wrongOn = f >= 238 && f < 262 ? 1 : 0;
  const shake = f >= 238 && f < 252 ? Math.sin((f - 238) * 1.6) * 9 : 0;

  // Escena 4: estrelles (290–360)
  const pileOut = interpolate(f, [286, 298], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardIn = spring({ frame: f - 292, fps, config: { damping: 14 } });
  const starsP = [306, 316, 326].map((s) => spring({ frame: f - s, fps, config: { damping: 9, stiffness: 160 } }));

  // Cursor
  const cur = f < 60 ? null
    : f < 88 ? { x: interpolate(f, [60, 88], [1150, fem0.x], { easing: ease }), y: interpolate(f, [60, 88], [640, fem0.y], { easing: ease }), down: f > 82 }
    : f < 124 ? { x: femX, y: femY, down: true }
    : f < 206 ? { x: interpolate(f, [150, 200], [femS.x, rad0.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }), y: interpolate(f, [150, 200], [femS.y, rad0.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }), down: f > 196 }
    : f < 238 ? { x: radX, y: radY, down: true }
    : f < 290 ? { x: radT.x + 30, y: radT.y + 40, down: false } : null;

  const caption = f < 60 ? "" : f < 200 ? "Arrossega el cromo fins al seu forat" : f < 292 ? "Si no hi va, rebota i torna al munt" : "Omple la pàgina i guanya estrelles";
  const capKey = f < 200 ? 0 : f < 292 ? 1 : 2;
  const capStart = [60, 200, 292][capKey];
  const capIn = spring({ frame: f - capStart, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: C.page, fontFamily: TEXT }}>
      <style>{FONTS}</style>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${C.dot} 2px, transparent 2.4px)`, backgroundSize: "20px 20px" }} />

      {/* Làmina */}
      <div style={{ position: "absolute", left: PL.left, top: PL.top, width: PL.w, height: PL.h, background: "#fff", borderRadius: 8, boxShadow: "0 0 0 12px #fff, 0 0 0 16px rgba(27,21,51,.1), 0 30px 50px -25px rgba(27,21,51,.6)" }}>
        <Img src={staticFile("atlas_art.webp")} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
      </div>
      <svg style={{ position: "absolute", inset: 0 }} width={1280} height={720}>
        {lineDraw > 0 && (
          <line x1={slotBox(FEMORAL).right} y1={py(FEMORAL.slotY)} x2={slotBox(FEMORAL).right + (px(FEMORAL.x) - slotBox(FEMORAL).right) * lineDraw}
            y2={py(FEMORAL.slotY) + (py(FEMORAL.y) - py(FEMORAL.slotY)) * lineDraw} stroke={C.art} strokeWidth={5} strokeLinecap="round" />
        )}
        {lineDraw >= 1 && <circle cx={px(FEMORAL.x)} cy={py(FEMORAL.y)} r={8} fill={C.art} stroke="#fff" strokeWidth={3} />}
      </svg>
      {ALL.filter((t) => ![FEMORAL.name, ILIACA.name].includes(t.name)).map((t) => <EmptySlot key={t.name} t={t} />)}
      <Slot t={ILIACA} wrong={wrongOn} shake={shake} />
      <Slot t={FEMORAL} filled={femStick} />

      {/* Munt de cromos */}
      <div style={{ position: "absolute", left: 760, top: 160, width: 470, height: 420, borderRadius: 28, background: C.cover, opacity: pileOut, boxShadow: "0 30px 60px -30px rgba(0,0,0,.7)" }}>
        <div style={{ position: "absolute", left: 34, top: 26, color: "#fff", fontFamily: DISPLAY, fontWeight: 900, fontSize: 46 }}>Munt de cromos</div>
      </div>
      <Cromo label="Braquial" x={PILE.Braquial.x} y={PILE.Braquial.y} rotate={1.5} opacity={pileOut} />
      {f < 124 && <Cromo label="Femoral" x={femX} y={femY} rotate={interpolate(femMove, [0, 0.5, 1], [-2, 5, 0])} scale={1 + 0.1 * Math.sin(femMove * Math.PI)} />}
      <Cromo label="Radial" x={radX} y={radY} wrong={wrongOn > 0} rotate={-1 + shake * 0.8} opacity={pileOut} />

      {/* Puntuació */}
      {f >= 124 && f < 175 && <Float text="+10" x={femS.x} y={femS.y - 30} p={(f - 124) / 50} />}
      {f >= 238 && f < 285 && <Float text="−3" x={radT.x} y={radT.y - 30} p={(f - 238) / 46} loss />}

      {/* Estrelles */}
      {f >= 292 && (
        <>
        <div style={{ position: "absolute", left: 760, top: 160, width: 470, height: 420, borderRadius: 28, background: C.paper, boxShadow: "0 0 0 5px #fff, 0 30px 60px -30px rgba(0,0,0,.7)", transform: `translateY(${interpolate(cardIn, [0, 1], [60, 0])}px) rotate(${interpolate(cardIn, [0, 1], [-4, 0])}deg)`, opacity: cardIn }}>
          <div style={{ position: "absolute", left: 40, top: 40, fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.ink, whiteSpace: "nowrap" }}>Pàgina completa</div>
        </div>
        <div style={{ position: "absolute", left: 818, top: 330, display: "flex", gap: 22 }}>
          {starsP.map((p, i) => (
            <svg key={i} width={110} height={110} viewBox="0 0 24 24" style={{ transform: `scale(${interpolate(p, [0, 1], [2.4, 1])}) rotate(${interpolate(p, [0, 1], [-20, 0])}deg)`, opacity: Math.min(1, p * 2) }}>
              <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill={C.foil} stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        </>
      )}

      {cur && <Cursor {...cur} />}

      {/* Subtítol */}
      {caption && (
        <div style={{
          position: "absolute", left: 640, bottom: 18, transform: `translate(-50%, ${interpolate(capIn, [0, 1], [30, 0])}px)`, opacity: capIn,
          padding: "10px 30px", borderRadius: 18, background: C.cover, color: "#fff",
          fontFamily: DISPLAY, fontWeight: 900, fontSize: 52, whiteSpace: "nowrap", boxShadow: `0 0 0 4px ${C.foil}`,
        }}>{caption}</div>
      )}

      {/* Títol inicial */}
      {f < 58 && (
        <AbsoluteFill style={{ background: C.cover, transform: `translateY(${-titleOut * 100}%)`, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 34, background: `repeating-linear-gradient(90deg, ${C.foil} 0 20px, ${C.foilDeep} 20px 23px)` }} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, color: "#fff", lineHeight: 0.9, textAlign: "center", transform: `scale(${interpolate(titleIn, [0, 1], [0.6, 1])})`, opacity: titleIn }}>
            Com es <span style={{ color: C.foil }}>juga</span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <Composition id="ComEsJuga" component={Tutorial} durationInFrames={360} fps={30} width={1280} height={720} />
);
