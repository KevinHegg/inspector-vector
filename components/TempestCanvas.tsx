"use client";
import { useEffect, useMemo, useRef } from "react";

export type Sector = {
  angle: number;
  lane: 0 | 1;
  color: string;
  label?: string;
  winner?: boolean;
};

export default function TempestCanvas({
  sectors,
  showGrid,
  showCosine,
  selected,
  onSelect,
}: {
  sectors: Sector[];
  showGrid: boolean;
  showCosine: boolean;
  selected: number[];
  onSelect: (i: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const pair = useMemo(
    () => (selected.length === 2 ? [selected[0], selected[1]] : null),
    [selected]
  );

  // stable resize observer that always calls the latest draw via drawRef
  useEffect(() => {
    const c = canvasRef.current!;
    const parent = c.parentElement!;
    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, window?.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      drawRef.current(); // use latest draw - ensures labels always render
    });
    ro.observe(parent);
    // initial paint
    requestAnimationFrame(() => drawRef.current());
    return () => ro.disconnect();
  }, []);

  // update draw function whenever inputs change
  useEffect(() => {
    drawRef.current = () => {
      const c = canvasRef.current!;
      const ctx = c.getContext("2d")!;
      const dpr = Math.max(1, window?.devicePixelRatio || 1);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = c.width / dpr;
      const h = c.height / dpr;
      if (w < 8 || h < 8) return;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.40; // small shrink for labels
      const r = R * 0.78;

      // GRID
      if (showGrid) {
        // axes to edges (bright, thicker)
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2.5;
        line(ctx, 0, cy, w, cy);
        line(ctx, cx, 0, cx, h);

        // numeric ticks −1, −0.5, 0, 0.5, 1
        ctx.fillStyle = "#e5e7eb";
        ctx.font = "bold 12px ui-sans-serif,system-ui,Segoe UI,Roboto";
        ctx.textAlign = "center";
        const ticks = [-1, -0.5, 0, 0.5, 1];
        const off = R * 1.10;
        ctx.textBaseline = "top";
        ticks.forEach((t) => ctx.fillText(String(t), cx + t * off, cy + 4));
        ctx.textBaseline = "middle";
        ticks.forEach((t) => ctx.fillText(String(t), cx - 14, cy - t * off));
      }

      // rings
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#06b6d4";
      strokedCircle(ctx, cx, cy, R);
      ctx.setLineDash([4, 5]);
      strokedCircle(ctx, cx, cy, r);
      ctx.setLineDash([]);

      // faint spokes
      ctx.strokeStyle = "rgba(148,163,184,0.16)";
      ctx.lineWidth = 1;
      const N = Math.max(sectors.length, 36);
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        line(ctx, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }

      // winner beams
      sectors.forEach((s) => {
        if (!s.winner) return;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        const a = s.angle;
        line(ctx, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      });

      // cosine overlay (always show minor arc) — lime lines, cyan arc/label
      if (showCosine && pair) {
        const [i, j] = pair;
        const a1 = sectors[i]?.angle ?? 0;
        const a2 = sectors[j]?.angle ?? 0;
        const minor = Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
        const end = a1 + minor;
        const anticlockwise = minor < 0;

        ctx.strokeStyle = "#84cc16"; // lime
        ctx.lineWidth = 2;
        line(ctx, cx, cy, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        line(ctx, cx, cy, cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);

        const ra = r * 0.52; // closer to origin
        ctx.strokeStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(cx, cy, ra, a1, end, anticlockwise);
        ctx.stroke();

        const mid = a1 + minor / 2;
        ctx.fillStyle = "#22d3ee";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "12px ui-sans-serif,system-ui,Segoe UI,Roboto";
        ctx.fillText(
          `cos θ = ${Math.cos(Math.abs(minor)).toFixed(2)}`,
          cx + Math.cos(mid) * (ra + 8),
          cy + Math.sin(mid) * (ra + 8)
        );
      }

      // tokens + labels (always)
      ctx.font = "12px ui-sans-serif,system-ui,Segoe UI,Roboto";
      sectors.forEach((s, i) => {
        const rr = s.lane === 0 ? R - 10 : r + 10;
        const px = cx + Math.cos(s.angle) * rr;
        const py = cy + Math.sin(s.angle) * rr;

        ctx.fillStyle = s.color;
        const picked = selected.includes(i);
        circle(ctx, px, py, picked ? 8 : 4);

        if (s.label) {
          ctx.fillStyle = "#e2e8f0";
          ctx.textBaseline = "middle";
          const cos = Math.cos(s.angle);
          if (s.lane === 0) {
            const lx = cx + Math.cos(s.angle) * (R + 18);
            const ly = cy + Math.sin(s.angle) * (R + 18);
            ctx.textAlign = cos >= 0 ? "left" : "right";
            ctx.fillText(s.label, lx, ly);
          } else {
            const lx = cx + Math.cos(s.angle) * (r - 18);
            const ly = cy + Math.sin(s.angle) * (r - 18);
            ctx.textAlign = Math.abs(cos) < 0.3 ? "center" : cos >= 0 ? "left" : "right";
            ctx.fillText(s.label, lx, ly);
          }
        }
      });
    };

    // draw immediately with new inputs
    drawRef.current();
  }, [sectors, showGrid, showCosine, selected]);

  // selection hit-test
  useEffect(() => {
    const c = canvasRef.current!;
    const onClick = (ev: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      const dpr = Math.max(1, window?.devicePixelRatio || 1);
      const w = c.width / dpr;
      const h = c.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.40;
      const r = R * 0.78;

      let best = -1, bestD = 1e9;
      sectors.forEach((s, i) => {
        const rr = s.lane === 0 ? R - 10 : r + 10;
        const px = cx + Math.cos(s.angle) * rr;
        const py = cy + Math.sin(s.angle) * rr;
        const d = Math.hypot(px - x, py - y);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0 && bestD <= 18) onSelect(best);
    };
    c.addEventListener("click", onClick);
    return () => c.removeEventListener("click", onClick);
  }, [sectors, onSelect]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

/* helpers */
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function strokedCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
