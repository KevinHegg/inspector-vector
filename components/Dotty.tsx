"use client";

import * as React from "react";
import Hint from "./Hint";

/** Animated SVG avatar for Dotty */
function DottyAvatar({
  size = 28,
  speaking = false,
  hiddenMode = false,
}: {
  size?: number;
  speaking?: boolean;
  hiddenMode?: boolean; // true when the panel is "Hide" (collapsed)
}) {
  const [tick, setTick] = React.useState(0);

  // rAF loop, minimal work per frame
  React.useEffect(() => {
    let raf = 0;
    let t0 = performance.now();
    const loop = (t: number) => {
      const dt = (t - t0) / 1000;
      t0 = t;
      setTick((v) => v + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const time = tick;

  // SVG viewBox centered at (0,0) for easy math
  const vb = { min: -24, max: 24 };

  // Eye positioning
  const baseY = -6; // eye center Y
  let eyeOffsetX = 0;
  let leftPupilY = baseY;
  let rightPupilY = baseY;

  if (hiddenMode) {
    // Eyes look down most of the time, tiny side-to-side sway
    const down = 1.6; // pixels downward inside the sclera
    eyeOffsetX = 0.8 * Math.sin(time * 0.9);
    leftPupilY = baseY + down;
    rightPupilY = baseY + down;

    // Occasional glance up from ONE eye, alternating
    const period = 4.8; // seconds per glance window
    const windowLen = 0.7; // glance duration
    const tmod = ((time % period) + period) % period;
    const glanceOn = tmod < windowLen;
    const leftGlance = Math.floor(time / period) % 2 === 0;

    if (glanceOn) {
      const up = -1.0; // small upward glance
      if (leftGlance) leftPupilY = baseY + up;
      else rightPupilY = baseY + up;
    }
  } else {
    // Normal (panel open): eyes pan horizontally together; gentle idle gate when not speaking
    const baseEyeAmp = 3.0;
    const gate = speaking ? 1.0 : 0.5 + 0.5 * Math.max(0, Math.sin(time * 0.4));
    eyeOffsetX = baseEyeAmp * gate * Math.sin(time * 1.2);
  }

  // Mouth: dotted wave, narrower dots, still in hidden mode
  const mouthDots = 13;
  const mouthBaseY = 10;
  const mouthAmp = hiddenMode ? 0 : speaking ? 2.2 : 0.8; // still when hidden
  const mouthSpeed = hiddenMode ? 0 : speaking ? 3.0 : 1.6;
  const mouthDotR = 0.7; // narrower than before

  const dots = Array.from({ length: mouthDots }, (_, i) => {
    const x = -16 + (32 * i) / (mouthDots - 1);
    const phase = i * 0.45 + time * mouthSpeed;
    const y = mouthBaseY + mouthAmp * Math.sin(phase);
    return { x, y };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${vb.min} ${vb.min} ${vb.max - vb.min} ${vb.max - vb.min}`}
      className="shrink-0"
      aria-hidden
    >
      {/* Glow/backdrop */}
      <defs>
        <radialGradient id="dottyGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.75)" />
          <stop offset="80%" stopColor="rgba(34,211,238,0.15)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0.0)" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="22" fill="url(#dottyGlow)" />
      <circle cx="0" cy="0" r="18" fill="rgba(34,211,238,0.35)" stroke="#22d3ee" strokeWidth="1.5" />

      {/* Eyes (sclera) */}
      <circle cx={-8} cy={-6} r={5.8} fill="#ffffff" opacity="0.95" />
      <circle cx={+8} cy={-6} r={5.8} fill="#ffffff" opacity="0.95" />

      {/* Pupils */}
      <circle cx={-8 + eyeOffsetX} cy={leftPupilY} r={2.6} fill="#0f172a" />
      <circle cx={+8 + eyeOffsetX} cy={rightPupilY} r={2.6} fill="#0f172a" />

      {/* Tiny highlights */}
      <circle cx={-8 + eyeOffsetX - 0.8} cy={leftPupilY - 0.8} r={0.7} fill="#e2e8f0" opacity="0.9" />
      <circle cx={+8 + eyeOffsetX - 0.8} cy={rightPupilY - 0.8} r={0.7} fill="#e2e8f0" opacity="0.9" />

      {/* Mouth — dotted line (narrower dots) */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={mouthDotR} fill="#0f172a" opacity="0.9" />
      ))}

      {/* Orbiting mini-pixels to imply “thinking” (kept subtle in hidden mode) */}
      {Array.from({ length: 6 }, (_, i) => {
        const speed = hiddenMode ? 0.5 : 0.9;
        const ang = (i / 6) * Math.PI * 2 + time * speed;
        const rr =
          20 + (hiddenMode ? 0.6 : 1.2) * Math.sin(time * (hiddenMode ? 1.2 : 1.8) + i * 0.7);
        const x = Math.cos(ang) * rr;
        const y = Math.sin(ang) * rr;
        return (
          <rect
            key={i}
            x={x - 0.9}
            y={y - 0.9}
            width={1.8}
            height={1.8}
            fill="#e879f9"
            opacity={hiddenMode ? 0.6 : 0.75}
          />
        );
      })}
    </svg>
  );
}

export default function Dotty({
  defaultOpen = true,
  metrics,
  deltas,
  showCosine,
  selectedCount,
  onToggleCosine,
  onIntent,
}: {
  defaultOpen?: boolean;
  metrics: { coherence: number; separation: number; coverage: number };
  deltas: { coherence: number; separation: number; coverage: number };
  showCosine: boolean;
  selectedCount: number;
  onToggleCosine: (v: boolean) => void;
  onIntent: (x: { action: "stabilize" | "beam" | "rotate"; args?: any }) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [speaking, setSpeaking] = React.useState(true);

  // Occasional “speaking” bursts when visible
  React.useEffect(() => {
    let stop = false;
    let to: any;
    const schedule = () => {
      if (stop) return;
      const next = speaking ? 1500 + Math.random() * 1500 : 3000 + Math.random() * 4000;
      to = setTimeout(() => {
        setSpeaking((v) => !v);
        schedule();
      }, next);
    };
    schedule();
    return () => {
      stop = true;
      clearTimeout(to);
    };
  }, [speaking]);

  const hiddenMode = !open;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DottyAvatar size={28} speaking={open && speaking} hiddenMode={hiddenMode} />
          <div className="text-sm font-semibold text-slate-200">Dotty</div>
          <Hint title="Who is Dotty?" preferredSide="right">
            <div className="text-left">
              Inspector Vector’s quirky sidekick. Dotty gives quick nudges that connect your moves (stabilize,
              beam, cosine) to how LLMs form and refine representations. When minimized, she keeps a low profile.
            </div>
          </Hint>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div className="mt-2 text-xs text-slate-300 space-y-2">
          <div>
            {selectedCount === 2 ? (
              <>Good pick, Inspector. Toggle cosine to compare directions — I’ll draw the minor angle.</>
            ) : (
              <>Select two tokens, then enable cosine to see similarity (cos θ).</>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onToggleCosine(!showCosine)}
              className="px-2 py-1 rounded bg-cyan-500 text-black hover:bg-cyan-400"
            >
              {showCosine ? "Hide cosine" : "Show cosine"}
            </button>
            <button
              onClick={() => onIntent({ action: "stabilize", args: { strength: 0.25 } })}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
            >
              Stabilize a bit
            </button>
            <button
              onClick={() => onIntent({ action: "rotate", args: { degrees: 5 } })}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
            >
              Rotate +5°
            </button>
            <button
              onClick={() => onIntent({ action: "beam", args: { mode: "auto" } })}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
            >
              Beam (auto)
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Tip: Coherence↑ = tighter clusters. Separation↑ = clearer categories. Coverage↑ = anchors with enough
            members. Nudge, then watch the meters.
          </div>
        </div>
      )}
    </section>
  );
}
