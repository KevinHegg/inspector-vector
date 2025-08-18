"use client";
import Hint from "./Hint";

type Props = {
  value: number;
  max?: number;
  showHomesEquivalent?: boolean;
  homesBaseline?: number;
  hint?: string;
  hintSide?: "left" | "right";
};

export default function EnergyMeter({
  value,
  max = 100,
  showHomesEquivalent = true,
  homesBaseline = 100,
  hint = "Energy is a teaching metaphor. 100% ≈ daily energy for 100 homes. As you act (advance/retry/utilities), energy drops. Later we’ll tie this to compute budget.",
  hintSide = "left",
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const pctText = `${Math.round(pct * 100)}%`;
  const homes = Math.round(homesBaseline * pct);

  return (
    <div className="space-y-2">
      <div className="text-xs tracking-wide text-slate-300 flex items-center gap-2">
        <span className="font-medium">Energy</span>
        <Hint title="What is energy?" side={hintSide}>{hint}</Hint>
      </div>

      <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden ring-1 ring-slate-700">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 transition-[width]"
          style={{ width: `${pct * 100}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          role="progressbar"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>{pctText}</span>
        {showHomesEquivalent && <span>≈ {homes} / {homesBaseline} homes (illustrative)</span>}
      </div>
    </div>
  );
}
