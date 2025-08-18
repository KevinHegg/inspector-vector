"use client";
import { useEffect, useState } from "react";
import TempestCanvas from "@/components/TempestCanvas";
import type { BoT } from "@/lib/types";

type Sector = { angle:number; lane:0|1; winner?:boolean; color?:string };

export default function Home() {
  const [bot, setBot] = useState<BoT|null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [layer, setLayer] = useState(1);
  const [answer, setAnswer] = useState<string>("");

  useEffect(() => {
    fetch("/api/bow").then(r=>r.json()).then((data:BoT) => {
      setBot(data);
      const N = 36;
      const base = Array.from({length:N}, (_,i)=> i/N * Math.PI*2);
      const rng = (i:number)=> (Math.sin(i*1337.7)+1)*0.5; // deterministic jitter
      const colorMap = data.ui_hints.cluster_colors as any;
      const clusters = Object.keys(colorMap);
      const pickColor = (i:number)=> colorMap[clusters[i % clusters.length]];
      const secs = base.map((a,i)=>({
        angle: a + (rng(i)-0.5)*0.08,
        lane: (i%2?1:0),
        color: pickColor(i)
      }));
      [3,11,18,27].forEach(i => (secs[i].winner = true)); // demo highlights
      setSectors(secs);
    });
  }, []);

  function advanceLayer() {
    setLayer(l => Math.min(10, l+1));
    setSectors(prev => prev.map((s,i)=>({ ...s, angle: s.angle + 0.02*(i%3-1), winner: (i%9===0) })));
    setAnswer("Sheriff arrested the thief because of tracks."); // placeholder
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">
        Inspector Vector - <span className="opacity-80">Train the model. Solve the mystery.</span>
      </h1>
      <div className="text-sm opacity-80">Layer {layer} / 10</div>
      <TempestCanvas sectors={sectors} title="Tempest web - current layer" />

      <div className="flex gap-3">
        <button onClick={advanceLayer} className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium">Advance Layer</button>
        <button className="px-4 py-2 rounded-lg bg-slate-700 text-white">Retry Layer</button>
        <button className="px-4 py-2 rounded-lg bg-amber-400 text-black">Cash Out</button>
      </div>

      {answer && (
        <div className="rounded-lg bg-slate-800/60 p-4 text-sm">
          <b>Answer:</b> {answer}
        </div>
      )}
    </main>
  );
}
