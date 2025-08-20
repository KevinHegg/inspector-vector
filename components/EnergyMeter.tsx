"use client";

import Hint from "./Hint";

export default function EnergyMeter({ energy }: { energy: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(energy)));
  const homes = Math.round((pct / 100) * 100); // illustrative
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold text-slate-200">Energy</div>
        <Hint title="Energy" preferredSide="right">
          <div className="text-left">
            Illustrative budget for your moves this layer. As you use utilities and round actions, energy
            drops. The “homes” equivalence is just a playful scale.
          </div>
        </Hint>
      </div>
      <div className="h-2 rounded bg-slate-800 overflow-hidden">
        <div className="h-2 bg-cyan-400" style={{ width: `${pct}%`, transition: "width 200ms ease" }} />
      </div>
      <div className="mt-1 text-[11px] text-slate-400">{pct}% ≈ {homes} / 100 homes (illustrative)</div>
    </section>
  );
}
