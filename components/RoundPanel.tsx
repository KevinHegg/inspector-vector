"use client";
import { useMemo, useState } from "react";
import Hint from "@/components/Hint";

export type RoundActionPayload =
  | { type: "stabilize"; strength: number }
  | { type: "beam"; mode: "auto" | "selected"; target?: number }
  | { type: "magnetize"; anchor: number; pull: number }
  | { type: "rotate"; degrees: number }
  | { type: "spread"; anchor: number; amount: number };

export default function RoundPanel({
  selected,
  rounds = 0,
  applied = false,
  onExecute,
  onNextRound,
  onForceNextLayer,
}: {
  selected: number[];
  rounds?: number; // 0..9
  applied?: boolean; // true after Apply, resets on next round
  onExecute: (p: RoundActionPayload) => void;
  onNextRound: () => void;
  onForceNextLayer: () => void;
}) {
  const [action, setAction] = useState<"stabilize"|"beam"|"magnetize"|"rotate"|"spread"|null>(null);
  const [strength, setStrength] = useState(0.25);
  const [degrees, setDegrees] = useState(5);
  const [amount, setAmount] = useState(0.4);
  const [mode, setMode] = useState<"auto"|"selected">("auto");

  // Action requirements per design brief
  const needsAnchor = action === "magnetize" || action === "spread";
  const anchorOk = !needsAnchor || selected.length >= 1;
  const beamSelectedOk = action === "beam" && mode === "selected" ? selected.length >= 1 : true;
  
  // Apply button enabled only when requirements met
  const canApply = action && anchorOk && beamSelectedOk && !applied;
  
  // Done button enabled only after Apply
  const canDone = applied;

  const apply = () => {
    if (!canApply) return;
    if (action === "stabilize") onExecute({ type: "stabilize", strength });
    if (action === "beam")     onExecute({ type: "beam", mode, target: mode==="selected" ? selected[0] : undefined });
    if (action === "magnetize" && anchorOk) onExecute({ type: "magnetize", anchor: selected[0], pull: amount });
    if (action === "rotate")   onExecute({ type: "rotate", degrees });
    if (action === "spread" && anchorOk) onExecute({ type: "spread", anchor: selected[0], amount });
  };

  const roundsLeft = 10 - (rounds + 1);
  const isLastRound = rounds >= 9;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-200">Round Actions</h3>
        <Hint title="Round flow" preferredSide="right">
          <div className="text-left">
            Pick <b>one</b> action, adjust its controls, then <b>Apply</b>. After the effect settles, click
            <b> Done — go to next round</b>. Ten rounds make a layer.
          </div>
        </Hint>
      </div>

      {/* actions list */}
      <div className="grid grid-cols-1 gap-2">
        {(["stabilize","beam","magnetize","rotate","spread"] as const).map((a) => (
          <div key={a} className="w-full">
            <div className="flex items-center justify-between gap-2">
              <button
                className={`px-3 py-1.5 rounded-md text-xs w-full text-left 
                  ${action===a ? "bg-cyan-500 text-black" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}
                  ${applied ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !applied && setAction(a)}
                disabled={applied}
              >
                {cap(a)}
              </button>
              <Hint title={cap(a)} preferredSide="right">
                <div className="text-left">
                  {a==="stabilize" && <>Gently nudge spokes toward even spacing (prior).</>}
                  {a==="beam" && <>Boost toward anchors ("attention"). Auto uses nearest anchors; Selected uses your chosen token.</>}
                  {a==="magnetize" && <>Pull tokens toward a chosen anchor (select one token first).</>}
                  {a==="rotate" && <>Rotate the whole field by a fixed angle (normalization trick).</>}
                  {a==="spread" && <>Push neighbors away from a chosen anchor to enlarge a cluster.</>}
                </div>
              </Hint>
            </div>

            {/* controls (visible only when chosen and not applied) */}
            {action===a && !applied && (
              <div className="mt-2 rounded-md border border-slate-700 bg-slate-900 p-2">
                {a==="stabilize" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 text-slate-300">Strength</span>
                    <input className="w-full" type="range" min={0} max={1} step={0.01}
                      value={strength} onChange={e=>setStrength(parseFloat(e.currentTarget.value))}/>
                    <span className="text-xs w-10 text-right">{strength.toFixed(2)}</span>
                  </div>
                )}
                {a==="beam" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs inline-flex items-center gap-2">
                      <input type="radio" name="beam" checked={mode==="auto"} onChange={()=>setMode("auto")} />
                      Auto
                    </label>
                    <label className="text-xs inline-flex items-center gap-2">
                      <input type="radio" name="beam" checked={mode==="selected"} onChange={()=>setMode("selected")} />
                      Selected
                    </label>
                  </div>
                )}
                {a==="magnetize" && (
                  <>
                    <div className="text-xs mb-1 text-slate-400">
                      {anchorOk ? "Anchor = first selected token" : "Select a token to use as anchor."}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-20 text-slate-300">Pull</span>
                      <input className="w-full" type="range" min={0} max={1} step={0.01}
                        value={amount} onChange={e=>setAmount(parseFloat(e.currentTarget.value))}/>
                      <span className="text-xs w-10 text-right">{amount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {a==="rotate" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 text-slate-300">Degrees</span>
                    <input className="w-full" type="range" min={-30} max={30} step={1}
                      value={degrees} onChange={e=>setDegrees(parseInt(e.currentTarget.value))}/>
                    <span className="text-xs w-10 text-right">{degrees}°</span>
                  </div>
                )}
                {a==="spread" && (
                  <>
                    <div className="text-xs mb-1 text-slate-400">
                      {anchorOk ? "Anchor = first selected token" : "Select a token to use as anchor."}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-20 text-slate-300">Amount</span>
                      <input className="w-full" type="range" min={0} max={1} step={0.01}
                        value={amount} onChange={e=>setAmount(parseFloat(e.currentTarget.value))}/>
                      <span className="text-xs w-10 text-right">{amount.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="mt-2">
                  <button
                    className={`w-full px-3 py-1.5 rounded-md text-xs 
                    ${!canApply ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-cyan-500 text-black hover:bg-cyan-400"}`}
                    disabled={!canApply}
                    onClick={apply}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3">
        <button
          onClick={isLastRound ? onForceNextLayer : onNextRound}
          className={`w-full px-3 py-2 rounded-md text-sm ${
            !canDone ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
            isLastRound ? "bg-emerald-500 text-black hover:bg-emerald-400" : 
            "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
          disabled={!canDone}
        >
          {!canDone ? "Apply an action first" :
           isLastRound ? "Done — Next Layer" : 
           `Done — go to round ${rounds + 2} / 10`}
        </button>
      </div>
    </section>
  );
}

function cap(s: string) { return s.slice(0,1).toUpperCase()+s.slice(1); }
