"use client";
import Hint from "./Hint";

type Counters = { used: number; max: number };

type Props = {
  showGrid: boolean;
  showCosine: boolean;   // overlay enabled (shows when two tokens are selected)
  showLabels: boolean;

  onToggleGrid(v: boolean): void;
  onToggleCosine(v: boolean): void;
  onToggleLabels(v: boolean): void;

  stabilize: Counters;
  beam: Counters;
  magnetize: Counters;

  onUseStabilize(): void;
  onUseBeam(): void;
  onUseMagnetize(): void;
};

function ButtonWithCount({
  label,
  counters,
  onClick,
  disabled,
}: {
  label: string;
  counters: Counters;
  onClick(): void;
  disabled?: boolean;
}) {
  const left = Math.max(0, counters.max - counters.used);
  return (
    <button
      disabled={disabled || left <= 0}
      onClick={onClick}
      className={[
        "w-full px-3 py-2 rounded-md text-sm",
        left > 0 && !disabled
          ? "bg-slate-700 text-white hover:bg-slate-600"
          : "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800",
      ].join(" ")}
    >
      {label} <span className="text-[10px] opacity-75">({counters.used}/{counters.max})</span>
    </button>
  );
}

export default function DisplayPanel({
  showGrid,
  showCosine,
  showLabels,
  onToggleGrid,
  onToggleCosine,
  onToggleLabels,
  stabilize,
  beam,
  magnetize,
  onUseStabilize,
  onUseBeam,
  onUseMagnetize,
}: Props) {
  return (
    <aside className="mt-4 rounded-lg border border-slate-700/60 p-3 text-xs text-slate-300 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Display</div>
        <Hint title="Visual layers" side="left">
          Toggle the Cartesian grid (for angles), the Cosine overlay (select two tokens to show arc and value), and token labels.
        </Hint>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={showGrid}
            onChange={(e) => onToggleGrid(e.currentTarget.checked)}
          />
          Show Cartesian grid
        </label>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-cyan-400"
              checked={showCosine}
              onChange={(e) => onToggleCosine(e.currentTarget.checked)}
            />
            Cosine overlay
          </label>
          <Hint title="Cosine overlay" side="left">
            Select any two tokens on the wheel to reveal the angle between them and the cosine value (similarity).
          </Hint>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={showLabels}
            onChange={(e) => onToggleLabels(e.currentTarget.checked)}
          />
          Show token labels
        </label>
      </div>

      <div className="pt-2 border-t border-slate-800/60" />

      <div className="flex items-center justify-between">
        <div className="font-semibold">Utilities</div>
        <Hint title="Utilities" side="left">
          Limited-use actions to shape your token space. Stabilize reduces jitter, Attention Beam highlights spokes, and
          Magnetize pulls related tokens. Uses reset each layer (for now).
        </Hint>
      </div>

      <div className="space-y-2">
        <ButtonWithCount label="Stabilize ring" counters={stabilize} onClick={onUseStabilize} />
        <ButtonWithCount label="Attention beam" counters={beam} onClick={onUseBeam} />
        <ButtonWithCount label="Magnetize cluster" counters={magnetize} onClick={onUseMagnetize} />
      </div>
    </aside>
  );
}
