"use client";

export default function LayerLadder({
  current,
  viewed,
  max,
  editMode,
  compact = true,
  onToggleEdit,
  onView,
}: {
  current: number;
  viewed: number;
  max: number;
  editMode: boolean;
  compact?: boolean;
  onToggleEdit: () => void;
  onView: (n: number) => void;
}) {
  const items = Array.from({ length: max }, (_, i) => i + 1).reverse(); // top = L10

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-200">LAYER LADDER</div>
        <button
          onClick={onToggleEdit}
          className="text-[11px] px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
          title="Edit lets you scrub older layers without advancing."
        >
          {editMode ? "Edit: On" : "Edit: Off"}
        </button>
      </div>
      <div className="space-y-1">
        {items.map((n) => {
          const active = n === current;
          const viewing = n === viewed;
          return (
            <button
              key={n}
              onClick={() => onView(n)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded border ${
                viewing
                  ? "border-cyan-500 bg-slate-800/60"
                  : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50"
              }`}
            >
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  active ? "bg-cyan-400" : "bg-slate-500"
                }`}
              />
              <span className="text-xs text-slate-200">L{n}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
