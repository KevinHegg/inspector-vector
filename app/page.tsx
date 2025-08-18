"use client";

import { useEffect, useMemo, useState } from "react";
import TempestCanvas, { Sector } from "@/components/TempestCanvas";
import ActionsPanel from "@/components/ActionsPanel";
import LayerLadder from "@/components/LayerLadder";
import RoundPanel from "@/components/RoundPanel";
import DisplayPanel from "@/components/DisplayPanel";
import type { BoT } from "@/lib/types";

// Layer state type for persistence
type LayerState = {
  sectors: Sector[];
  energy: number;
  selected: number[];
  uses: { stabilize: number; beam: number; magnetize: number };
};

function layerTip(bot: BoT | null, viewedLayer: number) {
  if (!bot) return "";
  const p = bot.prompt_scaffold.find((p) => p.layer === viewedLayer);
  return p?.text ?? "";
}
// Hide type prefix: "weapon.rope" -> "Rope"
const prettyLabel = (id: string) => {
  const last = (id.split(".").pop() ?? id).replace(/_/g, " ");
  return last.replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function Home() {
  const [bot, setBot] = useState<BoT | null>(null);
  const [layer, setLayer] = useState(1);
  const [viewLayer, setViewLayer] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // Initialize layer states array (10 layers)
  const [layerStates, setLayerStates] = useState<LayerState[]>(() => 
    Array.from({ length: 10 }, () => ({
      sectors: [],
      energy: 100,
      selected: [],
      uses: { stabilize: 0, beam: 0, magnetize: 0 }
    }))
  );

  // right-panel toggles
  const [showGrid, setShowGrid] = useState(false);
  const [showCosine, setShowCosine] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  // utility counters
  const MAX_USE = 3;

  // Derived state from current view layer
  const currentState = layerStates[viewLayer - 1];
  const sectors = currentState.sectors;
  const energy = currentState.energy;
  const selected = currentState.selected;
  const uses = currentState.uses;

  const maxLayers = 10;

  // seed
  useEffect(() => {
    fetch("/api/bow")
      .then((r) => r.json())
      .then((data: BoT) => {
        setBot(data);
        const tokens = data.tokens ?? [];
        const N = 36;
        const base = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);
        const rng = (i: number) => (Math.sin(i * 1337.7) + 1) * 0.5;
        const colorMap = data.ui_hints.cluster_colors as any;
        const clusters = Object.keys(colorMap);
        const pickColor = (i: number) => colorMap[clusters[i % clusters.length]];

        const init: Sector[] = base.map((a, i) => {
          const tok = tokens[i % tokens.length];
          return {
            angle: a + (rng(i) - 0.5) * 0.08,
            lane: (i % 2 ? 1 : 0) as 0 | 1,
            color: pickColor(i),
            label: tok ? prettyLabel(tok.id) : undefined,
          };
        });
        [3, 11, 18, 27].forEach((i) => (init[i].winner = true));
        
        // Initialize first layer state
        setLayerStates(prev => prev.map((state, idx) => 
          idx === 0 ? { ...state, sectors: init } : state
        ));
      });
  }, []);

  // selection for cosine overlay - update layer state
  function handleSelect(i: number) {
    const targetLayer = editMode ? viewLayer : layer;
    setLayerStates(prev => prev.map((state, idx) => {
      if (idx !== targetLayer - 1) return state;
      const newSelected = (() => {
        if (state.selected.includes(i)) return state.selected.filter(x => x !== i); // toggle off
        if (state.selected.length === 0) return [i];
        if (state.selected.length === 1) return [state.selected[0], i];
        // replace the older selection
        return [state.selected[1], i];
      })();
      return { ...state, selected: newSelected };
    }));
  }

  // actions
  function advanceLayer() {
    if (layer >= maxLayers) return;
    const targetLayer = editMode ? viewLayer : layer;
    if (editMode && targetLayer > layer) return; // Can't advance beyond current layer in edit mode
    
    const currentLayerState = layerStates[targetLayer - 1];
    const newSectors = currentLayerState.sectors.map((s, i) => 
      ({ ...s, angle: s.angle + 0.02 * (i % 3 - 1), winner: i % 9 === 0 })
    );
    const newEnergy = Math.max(0, currentLayerState.energy - 7);
    
    setLayerStates(prev => prev.map((state, idx) => {
      if (editMode) {
        // In edit mode, only update the viewed layer
        return idx === targetLayer - 1 ? {
          ...state,
          sectors: newSectors,
          energy: newEnergy,
          selected: [], // clear selection
          uses: { stabilize: 0, beam: 0, magnetize: 0 } // reset per layer
        } : state;
      } else {
        // Normal mode: update current and advance to next
        if (idx === layer - 1) {
          return {
            ...state,
            sectors: newSectors,
            energy: newEnergy,
            selected: [],
            uses: { stabilize: 0, beam: 0, magnetize: 0 }
          };
        } else if (idx === layer) {
          return {
            ...state,
            sectors: newSectors,
            energy: newEnergy,
            selected: [],
            uses: { stabilize: 0, beam: 0, magnetize: 0 }
          };
        }
      }
      return state;
    }));
    
    if (!editMode) {
      setLayer((l) => l + 1);
      setViewLayer((v) => Math.min(v + 1, maxLayers));
    }
  }
  
  function retryLayer() {
    const targetLayer = editMode ? viewLayer : layer;
    const currentLayerState = layerStates[targetLayer - 1];
    const newSectors = currentLayerState.sectors.map((s, i) => 
      ({ ...s, angle: s.angle + 0.01 * (1 - (i % 2) * 2) })
    );
    const newEnergy = Math.max(0, currentLayerState.energy - 3);
    
    setLayerStates(prev => prev.map((state, idx) => 
      idx === targetLayer - 1 ? {
        ...state,
        sectors: newSectors,
        energy: newEnergy,
        selected: []
      } : state
    ));
  }
  function cashOut() { alert(`You cashed out at Layer ${layer} with ${energy}% energy.`); }

  // utilities as pure mutators
  const mutateStabilize = (prev: Sector[]) =>
    prev.map((s, i, arr) => {
      const target = (i / arr.length) * Math.PI * 2;
      return { ...s, angle: s.angle + (target - s.angle) * 0.15 };
    });
  const mutateBeam = (prev: Sector[]) => prev.map((s, i) => ({ ...s, winner: i % 6 === 0 || s.winner }));
  const mutateMagnetize = (prev: Sector[]) => {
    const winners = prev
      .map((s, i) => ({ i, angle: s.angle, isW: !!s.winner }))
      .filter((x) => x.isW);
    if (winners.length === 0) return prev;
    return prev.map((s) => {
      let best = winners[0];
      for (const w of winners) if (Math.abs(w.angle - s.angle) < Math.abs(best.angle - s.angle)) best = w;
      return { ...s, angle: s.angle + (best.angle - s.angle) * 0.12 };
    });
  };

  const useOnce = (
    key: "stabilize" | "beam" | "magnetize",
    cost: number,
    mutate: (prev: Sector[]) => Sector[]
  ) => {
    const targetLayer = editMode ? viewLayer : layer;
    setLayerStates(prev => prev.map((state, idx) => {
      if (idx !== targetLayer - 1) return state;
      if (state.uses[key] >= MAX_USE) return state;
      return {
        ...state,
        uses: { ...state.uses, [key]: state.uses[key] + 1 },
        energy: Math.max(0, state.energy - cost),
        sectors: mutate(state.sectors)
      };
    }));
  };

  function useStabilize()  { if (uses.stabilize  >= MAX_USE) return; useOnce("stabilize", 2, mutateStabilize); }
  function useBeam()       { if (uses.beam       >= MAX_USE) return; useOnce("beam", 1, mutateBeam); }
  function useMagnetize()  { if (uses.magnetize  >= MAX_USE) return; useOnce("magnetize", 2, mutateMagnetize); }

  // Round execution: run queued actions in order
  function executeRound(queue: ("stabilize" | "beam" | "magnetize")[]) {
    queue.forEach(a => {
      if (a === "stabilize" && uses.stabilize < MAX_USE) useStabilize();
      if (a === "beam"      && uses.beam      < MAX_USE) useBeam();
      if (a === "magnetize" && uses.magnetize < MAX_USE) useMagnetize();
    });
  }

  // header line
  const subline = useMemo(() => {
    const left = `Layer ${layer} / ${maxLayers}`;
    const theme = bot?.theme ? ` · ${bot.theme}` : "";
    const tip = bot ? ` — Tip: ${layerTip(bot, viewLayer)}` : "";
    return `${left}${theme}${tip}`;
  }, [layer, maxLayers, bot, viewLayer]);

  // remaining uses per action (for round panel hints)
  const remaining = {
    stabilize: Math.max(0, MAX_USE - uses.stabilize),
    beam: Math.max(0, MAX_USE - uses.beam),
    magnetize: Math.max(0, MAX_USE - uses.magnetize),
  };

  return (
    <main className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-1">
        Inspector Vector — <span className="opacity-80">Train the model. Solve the mystery.</span>
      </h1>
      <div className="text-sm opacity-80 mb-4">{subline}</div>

      {/* Narrower side panels; larger center */}
      <div className="grid gap-4 items-stretch grid-cols-1 md:grid-cols-[200px_minmax(820px,1fr)_200px] min-h-[72vh]">
        {/* Left */}
        <div className="order-2 md:order-1 space-y-4">
          <ActionsPanel energy={energy} onAdvance={advanceLayer} onRetry={retryLayer} onCashOut={cashOut} />
          <RoundPanel
			  selected={selected}
			  onExecute={(intent) => {
				switch (intent.type) {
				  case "stabilize": /* apply your stabilize mutate using intent.strength */ break;
				  case "beam":      /* if intent.mode==='selected' use intent.target */   break;
				  case "magnetize": /* use intent.anchor and intent.pull */               break;
				  case "rotate":    /* rotate all angles by intent.degrees */             break;
				  case "spread":    /* push neighbors away from intent.anchor by amount*/ break;
				}
			  }}
          />

        </div>

        {/* Center: square wheel container (axes to edges, rings inset) */}
        <div className="order-1 md:order-2 space-y-3">
          <div className="rounded-xl bg-[#0b1220] border border-slate-800 overflow-visible">
            {/* square area for the canvas */}
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0">
                <TempestCanvas
                  sectors={sectors}
                  showGrid={showGrid}
                  showCosine={showCosine}
                  showLabels={showLabels}
                  selected={selected}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          </div>

          {/* Prompt/Response panel aligned with wheel container width */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <label className="text-xs text-slate-300 min-w-[90px]">Prompt</label>
                <input
                  className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1"
                  readOnly
                  value={layerTip(bot, viewLayer)}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <label className="text-xs text-slate-300 min-w-[90px]">Response</label>
                <input
                  className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1"
                  placeholder="(Generated later from your layer)"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="order-3">
          <LayerLadder 
            current={layer} 
            viewed={viewLayer} 
            max={maxLayers} 
            editMode={editMode}
            onToggleEdit={() => setEditMode(!editMode)}
            onView={(n) => setViewLayer(n)} 
          />
          <DisplayPanel
            showGrid={showGrid}
            showCosine={showCosine}
            showLabels={showLabels}
            onToggleGrid={setShowGrid}
            onToggleCosine={setShowCosine}
            onToggleLabels={setShowLabels}
            stabilize={{ used: uses.stabilize, max: MAX_USE }}
            beam={{ used: uses.beam, max: MAX_USE }}
            magnetize={{ used: uses.magnetize, max: MAX_USE }}
            onUseStabilize={useStabilize}
            onUseBeam={useBeam}
            onUseMagnetize={useMagnetize}
          />
        </div>
      </div>
    </main>
  );
}
