"use client";

import { useEffect, useMemo, useState } from "react";
import TempestCanvas, { type Sector } from "@/components/TempestCanvas";
import RoundPanel, { type RoundActionPayload } from "@/components/RoundPanel";
import LayerLadder from "@/components/LayerLadder";
import EnergyMeter from "@/components/EnergyMeter";
import Dotty from "@/components/Dotty";
import Hint from "@/components/Hint";
import type { BoT } from "@/lib/types";

/* helpers & metrics (same as before)… */
const TAU = Math.PI * 2;
const angNorm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const angDiff = (a: number, b: number) => angNorm(a - b);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const prettyLabel = (id: string) =>
  (id.split(".").pop() ?? id).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

// Cluster analysis for local summary
type ClusterView = {
  anchorIdx: number;
  anchorAngle: number;
  anchorLabel?: string;
  members: { idx: number; label?: string; angle: number; cosToAnchor: number }[];
};

function buildClusters(sectors: Sector[]): ClusterView[] {
  const TAU = Math.PI * 2;
  let anchors = sectors.map((s, i) => s.winner ? { i, a: s.angle } : null).filter(Boolean) as { i: number; a: number }[];
  if (!anchors.length) anchors = Array.from({ length: 4 }, (_, k) => ({ i: -1, a: (k / 4) * TAU }));

  const cls: ClusterView[] = anchors.map(a => ({ 
    anchorIdx: a.i, 
    anchorAngle: a.a, 
    anchorLabel: labelNear(sectors, a.a), 
    members: [] 
  }));
  
  sectors.forEach((s, idx) => {
    let best = 0, bestAbs = Infinity;
    cls.forEach((c, ci) => { 
      const d = Math.abs(angDiff(s.angle, c.anchorAngle)); 
      if (d < bestAbs) { bestAbs = d; best = ci; } 
    });
    const c = cls[best];
    c.members.push({ 
      idx, 
      label: s.label, 
      angle: s.angle, 
      cosToAnchor: Math.max(0, Math.cos(Math.abs(angDiff(s.angle, c.anchorAngle)))) 
    });
  });
  
  // sort members by cos desc
  cls.forEach(c => c.members.sort((a, b) => b.cosToAnchor - a.cosToAnchor));
  return cls;
}

function labelNear(sectors: Sector[], a: number) {
  let best: Sector | undefined, bestAbs = Infinity;
  sectors.forEach(s => { 
    const d = Math.abs(angDiff(s.angle, a)); 
    if (d < bestAbs) { bestAbs = d; best = s; } 
  });
  return best?.label;
}

function localResponse(
  promptText: string,
  sectors: Sector[],
  metrics: { coherence: number; separation: number; coverage: number }
): string {
  const clusters = buildClusters(sectors);
  const top = clusters
    .map(c => {
      const head = c.anchorLabel ?? "Anchor";
      const names = c.members.slice(0, 3).map(m => (m.label ?? "•")).join(", ");
      return `${head}: ${names}`;
    })
    .slice(0, 3)
    .join(" | ");

  // strongest pairwise similarities among token labels
  const pairs: string[] = [];
  for (let i = 0; i < sectors.length; i++) {
    for (let j = i + 1; j < sectors.length; j++) {
      const cos = Math.cos(Math.abs(angDiff(sectors[i].angle, sectors[j].angle)));
      if (cos > 0.9 && sectors[i].label && sectors[j].label) pairs.push(`${sectors[i].label}–${sectors[j].label} (${cos.toFixed(2)})`);
    }
  }
  const topPairs = pairs.slice(0, 3).join(" | ");

  const conf = Math.round(100 * (0.5 * metrics.coherence + 0.3 * metrics.separation + 0.2 * metrics.coverage));

  return [
    `Prompt: ${promptText}`,
    top ? `Clusters: ${top}` : `Clusters: forming...`,
    topPairs ? `Strong links: ${topPairs}` : `Strong links: none high yet.`,
    `Model confidence: ${conf}% (↑ with tighter & distinct clusters).`
  ].join("  ");
}

type Metrics = { coherence: number; separation: number; coverage: number };
function computeMetrics(sectors: Sector[]): Metrics {
  if (!sectors.length) return { coherence: 0, separation: 0, coverage: 0 };
  let centers = sectors.map((s,i)=> (s.winner ? {i,a:s.angle}:null)).filter(Boolean) as {i:number;a:number}[];
  if (!centers.length) centers = Array.from({length:4},(_,k)=>({i:-1,a:(k/4)*TAU}));
  const groups:number[][] = centers.map(()=>[]);
  sectors.forEach((s,si)=>{
    let best=0,bestAbs=Infinity;
    centers.forEach((c,ci)=>{ const d = Math.abs(angDiff(s.angle,c.a)); if(d<bestAbs){bestAbs=d;best=ci;}});
    groups[best].push(si);
  });
  let sumC=0,cnt=0;
  groups.forEach((g,gi)=>{ const a0=centers[gi].a; g.forEach(si=>{ const d=Math.abs(angDiff(sectors[si].angle,a0)); sumC+=Math.max(0,Math.cos(d)); cnt++;});});
  const coherence = cnt? sumC/cnt : 0;
  let sumPair=0,pairs=0;
  for(let i=0;i<centers.length;i++) for(let j=i+1;j<centers.length;j++){ const d=Math.abs(angDiff(centers[i].a,centers[j].a)); sumPair+=Math.max(0,Math.cos(d)); pairs++; }
  const separation = 1 - (pairs? sumPair/pairs : 1);
  const coverage = centers.length ? groups.filter(g=>g.length>=3).length/centers.length : 0;
  return { coherence: clamp01(coherence), separation: clamp01(separation), coverage: clamp01(coverage) };
}

/* state */
type LayerState = {
  sectors: Sector[];
  energy: number;
  selected: number[];
  uses: { stabilize: number; beam: number; magnetize: number };
  rounds: number;
  applied: boolean;
};

const CENTER_MAX = 980; // keeps title/canvas/prompt same width

export default function Home() {
  const [bot, setBot] = useState<BoT | null>(null);
  const [layer, setLayer] = useState(1);
  const [viewLayer, setViewLayer] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showCosine, setShowCosine] = useState(false);

  const maxLayers = 10;
  const MAX_USE = 3;

  const [layerStates, setLayerStates] = useState<LayerState[]>(
    () => Array.from({ length: maxLayers }, () => ({
      sectors: [], energy: 100, selected: [],
      uses: { stabilize: 0, beam: 0, magnetize: 0 },
      rounds: 0, applied: false
    }))
  );

  // Response management
  const [response, setResponse] = useState<string>("");

  const st = layerStates[viewLayer-1];
  const { sectors, energy, selected, uses, rounds } = st;

  const metrics = useMemo(()=>computeMetrics(sectors),[sectors]);
  const [lastDelta, setLastDelta] = useState<Metrics>({ coherence:0, separation:0, coverage:0 });
  
  // Scoring prototype per design brief
  const layerScore = useMemo(() => {
    return 100 * (0.5 * metrics.coherence + 0.3 * metrics.separation + 0.2 * metrics.coverage) + energy * 0.5;
  }, [metrics, energy]);
  
  // Layer gating thresholds
  const canAdvanceLayer = metrics.coherence >= 0.55 && metrics.separation >= 0.35;

  /* seed */
  useEffect(()=>{
    fetch("/api/bow").then(r=>r.json()).then((data:BoT)=>{
      setBot(data);
      const tokens = data.tokens ?? [];
      const N=36, base = Array.from({length:N},(_,i)=>(i/N)*TAU);
      const rng=(i:number)=>(Math.sin(i*1337.7)+1)*0.5;
      const colorMap = (data.ui_hints?.cluster_colors ?? {a:"#22d3ee",b:"#a78bfa",c:"#f472b6",d:"#f59e0b"}) as Record<string,string>;
      const clusters = Object.keys(colorMap); const pick = (i:number)=>colorMap[clusters[i%clusters.length]];
      const init: Sector[] = base.map((a,i)=>({ angle: a + (rng(i)-0.5)*0.08, lane: (i%2?1:0) as 0|1, color: pick(i), label: tokens[i%tokens.length] ? prettyLabel(tokens[i%tokens.length].id) : undefined }));
      [3,11,18,27].forEach(i=> (init[i].winner = true));
      setLayerStates(prev=> prev.map((s,idx)=> idx===0 ? {...s, sectors:init} : s));
      requestAnimationFrame(()=> window.dispatchEvent(new Event("resize")));
      
      // Generate initial local summary
      const initialPrompt = data.prompt_scaffold.find(p => p.layer === 1)?.text || "";
      const initialMetrics = computeMetrics(init);
      const initialSummary = localResponse(initialPrompt, init, initialMetrics);
      setResponse(initialSummary);
    });
  },[]);

  /* selection */
  function select(i:number){
    const target = editMode ? viewLayer : layer;
    setLayerStates(prev => prev.map((s,idx)=>{
      if (idx !== target-1) return s;
      const sel = s.selected.includes(i) ? s.selected.filter(x=>x!==i)
        : s.selected.length===0 ? [i]
        : s.selected.length===1 ? [s.selected[0], i]
        : [s.selected[1], i];
      return { ...s, selected: sel };
    }));
  }

  /* utilities (same as prior) */
  const useOnce = (
    key: "stabilize"|"beam"|"magnetize",
    cost: number,
    mutate:(prev:Sector[])=>Sector[]
  )=>{
    const target = editMode ? viewLayer : layer;
    setLayerStates(prev=> prev.map((s,idx)=>{
      if (idx!==target-1) return s;
      if (s.uses[key] >= MAX_USE) return s;
      const prevM = computeMetrics(s.sectors);
      const nextS = mutate(s.sectors);
      const nextM = computeMetrics(nextS);
      setLastDelta({
        coherence: nextM.coherence - prevM.coherence,
        separation: nextM.separation - prevM.separation,
        coverage: nextM.coverage - prevM.coverage,
      });
      return { ...s, sectors: nextS, energy: Math.max(0, s.energy - cost), uses: { ...s.uses, [key]: s.uses[key]+1 } };
    }));
  };
  const stabilizeUtil = (p:Sector[])=> p.map((s,i,a)=>{const t=(i/a.length)*TAU; return {...s,angle:angNorm(s.angle+(t-s.angle)*0.15)};});
  const beamUtil = (p:Sector[])=> p.map((s,i)=>({...s, winner: i%6===0 || s.winner}));
  const magnUtil = (p:Sector[])=>{
    const wins = p.map((s,i)=>({i,a:s.angle,w:!!s.winner})).filter(x=>x.w);
    if(!wins.length) return p;
    return p.map(s=>{
      let best = wins[0];
      for(const w of wins) if (Math.abs(angDiff(w.a,s.angle))<Math.abs(angDiff(best.a,s.angle))) best = w;
      return {...s, angle: angNorm(s.angle + (best.a - s.angle)*0.12)};
    });
  };
  const onUseStabilize = ()=> useOnce("stabilize",2,stabilizeUtil);
  const onUseBeam      = ()=> useOnce("beam",1,beamUtil);
  const onUseMagnetize = ()=> useOnce("magnetize",2,magnUtil);

  /* round actions (apply/next) */
  function applyRoundAction(p:RoundActionPayload){
    const target = editMode ? viewLayer : layer;
    setLayerStates(prev=> prev.map((s,idx)=>{
      if (idx!==target-1 || s.applied) return s;
      const prevM = computeMetrics(s.sectors);
      let next = s.sectors, cost=2;
      if (p.type==="stabilize"){ next = next.map((t,i,a)=>{const tgt=(i/a.length)*TAU; const g=0.08+0.25*clamp01(p.strength); return {...t, angle: angNorm(t.angle+(tgt-t.angle)*g)};});}
      if (p.type==="beam"){
        if (p.mode==="selected" && typeof p.target==="number"){
          const aT = next[p.target]?.angle ?? 0;
          next = next.map(t=>{ const d=Math.abs(angDiff(aT,t.angle)); const g=Math.max(0,Math.cos(d)); return {...t, angle: angNorm(t.angle + (aT - t.angle)*0.08*g)};});
        } else {
          const wins = next.map((s,i)=>({i,a:s.angle,w:!!s.winner})).filter(x=>x.w);
          if (wins.length){
            next = next.map(t=>{
              let best=wins[0]; for(const w of wins) if (Math.abs(angDiff(w.a,t.angle))<Math.abs(angDiff(best.a,t.angle))) best=w;
              const d=Math.abs(angDiff(best.a,t.angle)); const g=Math.max(0,Math.cos(d));
              return {...t, angle: angNorm(t.angle + (best.a - t.angle)*0.06*g)};
            });
          }
        }
      }
      if (p.type==="magnetize"){ const aA = next[p.anchor]?.angle ?? 0; const pull=0.12+0.3*clamp01(p.pull); next = next.map((t,i)=> i===p.anchor? t : ({...t, angle: angNorm(t.angle + (aA - t.angle)*pull*Math.max(0,Math.cos(Math.abs(angDiff(aA,t.angle)))))})); cost=3; }
      if (p.type==="rotate"){ const d=(p.degrees*Math.PI)/180; next = next.map(t=>({...t, angle: angNorm(t.angle + d)})); cost=1; }
      if (p.type==="spread"){ const aA = next[p.anchor]?.angle ?? 0; const amt=0.2+0.35*clamp01(p.amount); next = next.map((t,i)=>{ if(i===p.anchor) return t; const d=angDiff(t.angle,aA); const g=Math.pow(Math.max(0,Math.cos(Math.abs(d))),1.5); return {...t, angle: angNorm(t.angle + Math.sign(d)*amt*g)};}); cost=3; }

      const nextM = computeMetrics(next);
      setLastDelta({
        coherence: nextM.coherence - prevM.coherence,
        separation: nextM.separation - prevM.separation,
        coverage: nextM.coverage - prevM.coverage,
      });
      
      // Generate local summary after action
      const currentPrompt = bot?.prompt_scaffold.find(p => p.layer === viewLayer)?.text || "";
      const summary = localResponse(currentPrompt, next, nextM);
      setResponse(summary);
      
      return { ...s, sectors: next, energy: Math.max(0, s.energy - cost), applied: true };
    }));
  }
  function nextRound(){
    const target = editMode ? viewLayer : layer;
    setLayerStates(prev=> prev.map((s,idx)=>{
      if (idx!==target-1) return s;
      if (!s.applied) return s;
      return { ...s, rounds: Math.min(9, s.rounds+1), applied:false };
    }));
  }

  function nextLayer(){
    if (layer>=maxLayers) return;
    if (!canAdvanceLayer) {
      // Show helpful feedback - could integrate with Dotty later
      console.log("Cannot advance: Coherence < 0.55 or Separation < 0.35");
      return;
    }
    
    setLayerStates(prev=> prev.map((s,idx)=>{
      if (idx===layer-1) return { ...s, selected:[], applied:false };
      if (idx===layer){
        const seeded = s.sectors.length ? s.sectors
          : prev[layer-1].sectors.map((t,i)=>({...t, angle: angNorm(t.angle+0.02*(i%3-1)), winner: i%9===0 || t.winner}));
        return { ...s, sectors: seeded, energy:100, selected:[], uses:{stabilize:0,beam:0,magnetize:0}, rounds:0, applied:false };
      }
      return s;
    }));
    setLayer(l=>l+1);
    setViewLayer(v=> Math.min(v+1,maxLayers));
    
    // Generate local response for new layer
    const newLayerState = layerStates[layer];
    if (newLayerState && bot) {
      const newPrompt = bot.prompt_scaffold.find(p => p.layer === layer + 1)?.text || "";
      const newMetrics = computeMetrics(newLayerState.sectors);
      const newResponse = localResponse(newPrompt, newLayerState.sectors, newMetrics);
      setResponse(newResponse);
    }
  }

  /* subline */
  const subline = useMemo(()=>{
    const left = `Layer ${layer} / ${maxLayers}`;
    const theme = bot?.theme ? ` · ${bot.theme}` : "";
    const tip = bot ? ` — Tip: ${bot.prompt_scaffold.find(p=>p.layer===viewLayer)?.text ?? ""}` : "";
    return `${left}${theme}${tip}`;
  },[layer,maxLayers,bot,viewLayer]);

  return (
    <main className="p-4 md:p-6">
      {/* Title band centered and same width as Tempest */}
      <div className="mx-auto rounded-xl border border-slate-800 bg-slate-900/60 p-3 max-w-[calc(var(--center-max)*1px)]"
           style={{ // expose width to CSS without duplicating numbers
             // @ts-ignore
             ["--center-max" as any]: CENTER_MAX
           }}>
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">
          Inspector Vector — <span className="opacity-80">Train the model. Solve the mystery.</span>
        </h1>
        <div className="text-sm opacity-80">{subline}</div>
      </div>

      {/* Top panels row - top-aligned with banner container */}
      <div className="flex gap-3 justify-center">
         {/* LEFT: Model meters + Utilities + Round actions */}
         <div className="flex flex-col gap-3" style={{ width: 260 }}>
           <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-semibold text-slate-200">Model Meters</h3>
               <Hint title="What are these?" preferredSide="right">
                 <div className="text-left">
                   These are <b>evaluation metrics</b> for your vector field, not model weights/parameters.
                   <br/><br/>
                   <a href="https://en.wikipedia.org/wiki/Large_language_model" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Learn about LLMs →</a>
                 </div>
               </Hint>
             </div>
             <MetricBar label="Coherence">
               <Hint title="Coherence" preferredSide="right">
                 Higher when tokens align with their cluster's center direction. 
                 <br/><br/>
                 <a href="https://en.wikipedia.org/wiki/Vector_space_model" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Vector spaces →</a>
               </Hint>
             </MetricBar>
             <Bar value={metrics.coherence} delta={lastDelta.coherence}/>
             
             <MetricBar label="Separation">
               <Hint title="Separation" preferredSide="right">
                 Higher when clusters point in different directions (low cosine between centers).
                 <br/><br/>
                 <a href="https://en.wikipedia.org/wiki/Cosine_similarity" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Cosine similarity →</a>
               </Hint>
             </MetricBar>
             <Bar value={metrics.separation} delta={lastDelta.separation}/>
             
             <MetricBar label="Coverage">
               <Hint title="Coverage" preferredSide="right">
                 Fraction of anchors/clusters that have enough members to be meaningful.
                 <br/><br/>
                 <a href="https://en.wikipedia.org/wiki/Cluster_analysis" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Cluster analysis →</a>
               </Hint>
             </MetricBar>
             <Bar value={metrics.coverage} delta={lastDelta.coverage}/>
             
             {/* Layer Score */}
             <div className="mt-3 pt-3 border-t border-slate-700">
               <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                 <span className="font-medium">Layer Score</span>
                 <Hint title="Layer Score" preferredSide="right">
                   Combines metrics (50% Coherence, 30% Separation, 20% Coverage) plus remaining energy bonus.
                   <br/><br/>
                   <a href="https://en.wikipedia.org/wiki/Evaluation_metric" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Evaluation metrics →</a>
                 </Hint>
               </div>
               <div className="text-lg font-bold text-cyan-400">
                 {Math.round(layerScore)}
               </div>
               <div className="text-xs text-slate-400">
                 {canAdvanceLayer ? "✅ Ready for next layer" : "❌ Need Coherence ≥55% & Separation ≥35%"}
               </div>
             </div>
           </section>

           <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-semibold text-slate-200">Utilities</h3>
               <Hint title="How to use Utilities" preferredSide="right">
                 <div className="text-left">
                   Quick actions with limited uses per layer. Click "Use" to apply the effect.
                   <br/><br/>
                   <a href="https://en.wikipedia.org/wiki/Game_mechanics" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Game mechanics →</a>
                 </div>
               </Hint>
             </div>
             <UtilRow label="Stabilize" count={uses.stabilize} max={MAX_USE} onClick={onUseStabilize} />
             <UtilRow label="Beam"      count={uses.beam}      max={MAX_USE} onClick={onUseBeam} />
             <UtilRow label="Magnetize" count={uses.magnetize} max={MAX_USE} onClick={onUseMagnetize} />
           </section>

           {/* Round Actions - Made more prominent */}
           <section className="rounded-xl border-2 border-cyan-500 bg-slate-900/70 p-3 shadow-[0_0_0_2px_rgba(34,211,238,0.15)_inset]">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-sm font-bold text-cyan-300">🎯 Round Actions</h3>
               <Hint title="Round Actions" preferredSide="right">
                 <div className="text-left">
                   Choose one action per round, then Apply to execute. This is where most of your gameplay decisions happen!
                   <br/><br/>
                   <a href="https://en.wikipedia.org/wiki/Turn-based_game" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Turn-based gameplay →</a>
                 </div>
               </Hint>
             </div>
             <RoundPanel
               selected={selected}
               rounds={rounds}
               applied={st.applied}
               onExecute={applyRoundAction}
               onNextRound={nextRound}
               onForceNextLayer={nextLayer}
             />
           </section>
         </div>

        {/* CENTER: Tempest + Prompt/Response (same width as title) */}
        <div className="flex flex-col gap-3 items-center">
          <div className="rounded-xl bg-[#0b1220] border border-slate-800 overflow-visible"
               style={{ width: CENTER_MAX }}>
            <div className="relative w-full aspect-square min-h-[460px]">
              <div className="absolute inset-0">
                <TempestCanvas
                  sectors={sectors}
                  showGrid={showGrid}
                  showCosine={showCosine}
                  selected={selected}
                  onSelect={select}
                />
              </div>
            </div>
          </div>

         <section className="rounded-xl border border-cyan-700 bg-slate-900/60 p-3 text-sm shadow-[0_0_0_2px_rgba(34,211,238,0.08)_inset]"
                  style={{ width: CENTER_MAX }}>
             <div className="flex items-start gap-6">
               <div className="flex-1 flex flex-col gap-2">
                 <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                   <label className="text-xs text-slate-300 min-w-[90px]">Prompt</label>
                   <input className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1"
                          readOnly
                          value={bot ? bot.prompt_scaffold.find(p=>p.layer===viewLayer)?.text ?? "" : ""}/>
                 </div>
                 <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                   <label className="text-xs text-slate-300 min-w-[90px]">Response</label>
                   <div className="flex-1 flex flex-col gap-2">
                     <textarea 
                       className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1 min-h-[60px] resize-none"
                       readOnly
                       value={response || "(Local analysis will appear here after each action)"}
                       placeholder="(Local analysis will appear here after each action)"
                     />
                     <div className="flex items-center justify-between text-xs text-slate-400">
                       <span>Live analysis after each Apply</span>
                     </div>
                     
                     {/* Layer gating message */}
                     {!canAdvanceLayer && (
                       <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700/50 rounded text-xs text-amber-200">
                         ⚠️ Tighten clusters or separate anchors to advance. Need Coherence ≥55% & Separation ≥35%.
                       </div>
                     )}
                   </div>
                   
                   {/* Boss Result Display */}
                   {/* Removed bossResult display as per edit hint */}
                 </div>
               </div>

                               {/* right-side vertical toggles */}
                <div className="w-[220px] shrink-0 flex flex-col gap-3">
                  <label className="text-xs inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-cyan-400"
                           checked={showGrid} onChange={e=>setShowGrid(e.currentTarget.checked)}/>
                    Show Cartesian Grid
                    <Hint title="Cartesian grid" preferredSide="left">
                      X/Y axes through the origin with ticks at −1, −0.5, 0, 0.5, 1. Helps visualize angles & cosine.
                      <br/><br/>
                      <a href="https://en.wikipedia.org/wiki/Cartesian_coordinate_system" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Cartesian coordinates →</a>
                    </Hint>
                  </label>
                  <label className="text-xs inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-cyan-400"
                           checked={showCosine} onChange={e=>setShowCosine(e.currentTarget.checked)}/>
                    Cosine overlay
                    <Hint title="Cosine overlay" preferredSide="left">
                      Select two tokens to highlight the <em>smaller</em> angle and show its cosine (−1..1).
                      <br/><br/>
                      <a href="https://en.wikipedia.org/wiki/Cosine_similarity" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Cosine similarity →</a>
                    </Hint>
                  </label>
                </div>
             </div>
           </section>
         </div>

        {/* RIGHT: Dotty + Energy + Ladder */}
        <div className="flex flex-col gap-3" style={{ width: 260 }}>
          <Dotty
            defaultOpen={true}
            metrics={metrics}
            deltas={lastDelta}
            showCosine={showCosine}
            selectedCount={selected.length}
            onToggleCosine={setShowCosine}
            onIntent={(x) => {
              if (x.action === "stabilize") applyRoundAction({ type: "stabilize", strength: x.args?.strength ?? 0.25 });
              if (x.action === "rotate")    applyRoundAction({ type: "rotate", degrees: x.args?.degrees ?? 5 });
              if (x.action === "beam")      applyRoundAction({ type: "beam", mode: "auto" });
            }}
          />

          {/* Energy moved here */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
              Energy
              <Hint title="Energy" preferredSide="left">
                Illustrative budget per layer (e.g., "power for N homes"). Actions consume energy; finishing with more is better.
                <br/><br/>
                <a href="https://en.wikipedia.org/wiki/Resource_management" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Resource management →</a>
              </Hint>
            </div>
            <EnergyMeter energy={energy}/>
          </section>

          <LayerLadder
            current={layer}
            viewed={viewLayer}
            max={maxLayers}
            editMode={editMode}
            onToggleEdit={() => setEditMode(!editMode)}
            onView={(n) => setViewLayer(n)}
          />
        </div>
      </div>
    </main>
  );
}

/* UI bits */
function MetricBar({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-1">
          {children}
        </span>
      </div>
    </div>
  );
}
function Bar({ value, delta }: { value: number; delta?: number }) {
  const pct = Math.round(100 * clamp01(value));
  const sign = !delta ? 0 : delta > 0 ? 1 : delta < 0 ? -1 : 0;
  const deltaTxt = (delta ?? 0).toFixed(2);
  return (
    <>
      <div className="h-2 rounded bg-slate-800 overflow-hidden">
        <div className="h-2 bg-cyan-400" style={{ width: `${pct}%`, transition: "width 260ms ease" }} />
      </div>
      <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
        <span>{pct}%</span>
        <span className={sign>0 ? "text-emerald-300" : sign<0 ? "text-rose-300" : "text-slate-400"}>
          {sign>0 ? "▲" : sign<0 ? "▼" : "•"} {deltaTxt}
        </span>
      </div>
    </>
  );
}
function UtilRow({ label, count, max, onClick }:{
  label:string; count:number; max:number; onClick:()=>void;
}) {
  const left = Math.max(0, max - count);
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-slate-200">{label} <span className="text-xs text-slate-400">({count}/{max})</span></div>
      <button
        disabled={left<=0}
        onClick={onClick}
        className={`px-3 py-1.5 rounded-md text-xs ${left>0 ? "bg-cyan-500 text-black hover:bg-cyan-400" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
      >
        Use
      </button>
    </div>
  );
}
