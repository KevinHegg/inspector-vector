"use client";
import { useEffect, useRef } from "react";
type Sector = { angle:number; lane:0|1; winner?:boolean; color?:string };

export default function TempestCanvas({ sectors, title }:{ sectors: Sector[]; title: string }) {
  const ref = useRef<HTMLCanvasElement|null>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height, cx = W/2, cy = H/2;
    const R_OUT = Math.min(W,H)*0.38, R_IN = R_OUT*0.88;
    const polar = (a:number, r:number) => [cx + r*Math.cos(a), cy - r*Math.sin(a)] as const;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#080A0E"; ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx,cy,R_OUT,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([7,9]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx,cy,R_IN,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(59,130,246,0.35)"; ctx.lineWidth = 1;
    sectors.forEach(s => { const [x,y]=polar(s.angle,R_OUT*1.02); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke(); });

    sectors.forEach((s) => {
      const r = s.lane===0 ? R_OUT : R_IN;
      const [x,y] = polar(s.angle, r);
      ctx.fillStyle = s.color ?? (s.winner ? "#ffd166" : "#e5e7eb");
      const size = s.winner ? 6 : 4;
      ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill();
    });

    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(16,16, 520, 36);
    ctx.fillStyle = "#e5e7eb"; ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(title, 24, 40);
  }, [sectors, title]);

  return <canvas ref={ref} width={1200} height={720} className="mx-auto block rounded-xl shadow-lg" />;
}
