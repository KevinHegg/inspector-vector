"use client";
import { useEffect, useRef } from "react";

export type Sector = {
  angle: number;          // radians
  lane: 0 | 1;            // 0 = outer ring, 1 = inner ring
  winner?: boolean;
  color?: string;
  label?: string;
};

type Props = {
  sectors: Sector[];
  showGrid?: boolean;
  showCosine?: boolean;   // draw cosine arc/value when two tokens selected
  showLabels?: boolean;
  selected?: number[];    // indices of selected sectors (0..N-1)
  onSelect?: (index: number) => void; // click handler
};

export default function TempestCanvas({
  sectors,
  showGrid = false,
  showCosine = false,
  showLabels = false,
  selected = [],
  onSelect,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dprRef = useRef<number>(1);
  const sizeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = (dprRef.current = Math.max(1, window?.devicePixelRatio || 1));

    /* ------------------------------ helpers ------------------------------ */
    const angNorm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
    const angDiff = (a: number, b: number) => angNorm(a - b);
    const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

    /* -------------------------------- draw -------------------------------- */
    const draw = () => {
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const cx = W / 2;
      const cy = H / 2;

      // Reserve margin for labels; wheel grows to max within it
      const PAD = Math.max(36, Math.min(W, H) * 0.09);
      const R_OUT = Math.min(W, H) / 2 - PAD;
      const R_IN = R_OUT * 0.88;

      const polar = (a: number, r: number) =>
        [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;

      // BACKGROUND
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, W, H);

      // ------------------------ WHEEL: rings + spokes -----------------------
      // RINGS (kept inside so labels can fit near edges)
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R_OUT, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([7, 9]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R_IN, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // SPOKES
      ctx.strokeStyle = "rgba(59,130,246,0.45)";
      ctx.lineWidth = 1.2;
      sectors.forEach((s) => {
        const [x, y] = polar(s.angle, R_OUT * 1.02);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      });

      // -------------------------- GRID (overlay) ----------------------------
      // Axes drawn AFTER wheels so grid sits above rings/spokes but below tokens
      if (showGrid) {
        ctx.save();
        ctx.translate(cx, cy);

        const halfW = W / 2;
        const halfH = H / 2;

        // Axes to edges
        ctx.strokeStyle = "rgba(203,213,225,0.9)";
        ctx.lineWidth = 2;
        // X
        ctx.beginPath(); ctx.moveTo(-halfW, 0); ctx.lineTo(halfW, 0); ctx.stroke();
        // Y
        ctx.beginPath(); ctx.moveTo(0, -halfH); ctx.lineTo(0, halfH); ctx.stroke();

        // Ticks & labels at -1,-0.5,0.5,1 (scaled by R_OUT)
        ctx.strokeStyle = "rgba(148,163,184,0.95)";
        ctx.fillStyle = "rgba(226,232,240,0.98)";
        ctx.lineWidth = 1.6;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";

        const ticks = [-1, -0.5, 0.5, 1];
        ticks.forEach((t) => { // X
          const x = t * R_OUT;
          ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x, 8); ctx.stroke();
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(String(t), x, 10);
        });
        ticks.forEach((t) => { // Y
          const y = t * R_OUT;
          ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(8, y); ctx.stroke();
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          ctx.fillText(String(t), -12, y);
        });

        ctx.restore();
      }

      // ------------------------- COSINE OVERLAY -----------------------------
      // Independent of grid; shows when enabled AND exactly two selected
      if (showCosine && selected.length === 2) {
        const i1 = selected[0], i2 = selected[1];
        const a1 = sectors[i1]?.angle ?? 0;
        const a2 = sectors[i2]?.angle ?? 0;

        // Shortest signed difference and midpoint (model-space)
        const d = angDiff(a2, a1);
        const mid = a1 + d / 2;

        // Canvas arc uses clockwise angles; convert model angle 'a' -> canvas '-a'
        const start = -a1;
        const end = -a2;
        const anticw = d > 0; // draw the short way

        const rArc = R_OUT * 0.62;

        // arc
        ctx.strokeStyle = "#f59e0b"; // amber-500
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, rArc, start, end, anticw);
        ctx.stroke();

        // rays
        const [x1, y1] = [cx + R_OUT * Math.cos(a1), cy - R_OUT * Math.sin(a1)];
        const [x2, y2] = [cx + R_OUT * Math.cos(a2), cy - R_OUT * Math.sin(a2)];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke();

        // numeric cos value at mid-angle just outside arc
        const rLabel = R_OUT * 0.70;
        const lx = cx + rLabel * Math.cos(mid);
        const ly = cy - rLabel * Math.sin(mid);
        const cosv = Math.cos(Math.abs(d));
        ctx.fillStyle = "#fde68a"; // amber-200
        ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`cos Δ ≈ ${cosv.toFixed(2)}`, lx, ly);
      }

      // ------------------------- TOKENS + LABELS ----------------------------
      const labelOffsetOuter = Math.max(10, PAD * 0.45);
      const labelOffsetInner = Math.max(10, PAD * 0.35);

      sectors.forEach((s, i) => {
        const r = s.lane === 0 ? R_OUT : R_IN;
        const [x, y] = polar(s.angle, r);

        // token dot
        const isSel = selected.includes(i);
        ctx.fillStyle = s.color ?? (s.winner ? "#ffd166" : "#e5e7eb");
        const size = isSel ? 7 : s.winner ? 6 : 4;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();

        // labels: outer -> outside; inner -> inside
        if (showLabels && s.label) {
          const offset = s.lane === 0 ? labelOffsetOuter : labelOffsetInner;
          const labelR = s.lane === 0 ? r + offset : r - offset;
          const [lx, ly] = polar(s.angle, labelR);

          ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textBaseline = "middle";

          // Outer: text away from center; Inner: text toward center
          const rightSide = Math.cos(s.angle) >= 0;
          let align: CanvasTextAlign;
          let dx: number;
          if (s.lane === 0) { // outer
            align = rightSide ? "left" : "right";
            dx = rightSide ? 5 : -5;
          } else {           // inner
            align = rightSide ? "right" : "left";
            dx = rightSide ? -5 : 5;
          }
          ctx.textAlign = align;
          ctx.fillStyle = "rgba(255,255,255,0.96)";
          ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 2;

          // clamp to keep labels inside container horizontally
          const tx = clamp(lx + dx, PAD + 2, W - PAD - 2);
          ctx.fillText(s.label, tx, ly);
          ctx.shadowBlur = 0;
        }
      });
    };

    /* ------------------------------ resize ------------------------------ */
    const resize = () => {
      const wrap = wrapRef.current!;
      const rect = wrap.getBoundingClientRect();
      // Make square based on width (page uses aspect-square, but this guards if not)
      const target = Math.max(620, rect.width);
      if (Math.abs(target - sizeRef.current) < 0.5) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      sizeRef.current = target;

      const d = Math.floor(target * dpr);
      canvas.style.width = `${target}px`;
      canvas.style.height = `${target}px`;
      canvas.width = d;
      canvas.height = d;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(resize);
    });
    ro.observe(wrapRef.current!);
    resize();

    /* ------------------------------ clicks ------------------------------ */
    const onClick = (ev: MouseEvent) => {
      if (!onSelect) return;
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const cx = W / 2, cy = H / 2;

      const dx = x - cx;
      const dy = cy - y; // invert y to match our polar()
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);

      // recompute radii to decide which lane was clicked
      const PAD = Math.max(36, Math.min(W, H) * 0.09);
      const R_OUT = Math.min(W, H) / 2 - PAD;
      const R_IN = R_OUT * 0.88;
      const laneGuess: 0 | 1 = Math.abs(r - R_OUT) < Math.abs(r - R_IN) ? 0 : 1;

      // pick nearest sector on the guessed lane by angular distance
      let best = -1, bestAbs = Infinity;
      sectors.forEach((s, i) => {
        if (s.lane !== laneGuess) return;
        const d = Math.abs(Math.atan2(Math.sin(s.angle - a), Math.cos(s.angle - a)));
        if (d < bestAbs) { bestAbs = d; best = i; }
      });
      if (best >= 0) onSelect(best);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("click", onClick);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [sectors, showGrid, showCosine, showLabels, selected, onSelect]);

  return (
    <div ref={wrapRef} className="w-full h-full grid place-items-center">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg" />
    </div>
  );
}
