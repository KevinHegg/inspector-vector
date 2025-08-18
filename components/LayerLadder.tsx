"use client";

type Props = {
  current: number;
  viewed: number;
  max: number;
  editMode: boolean;
  onToggleEdit(): void;
  onView(layer:number): void;
};

export default function LayerLadder({ current, viewed, max, editMode, onToggleEdit, onView }: Props) {
  const layers = Array.from({length: max}, (_,i)=> i+1).reverse();
  return (
    <aside className="flex flex-col items-center">
      <div className="text-xs uppercase tracking-wide text-slate-300 mb-2">Layer Ladder</div>
      <button
        onClick={onToggleEdit}
        className={[
          "mb-3 px-2 py-1 text-[10px] rounded border transition",
          editMode ? "bg-amber-500/20 border-amber-400 text-amber-300" :
                    "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500"
        ].join(" ")}
        title={editMode ? "Exit edit mode" : "Enter edit mode"}
      >
        {editMode ? "🔓 EDIT" : "🔒 VIEW"}
      </button>
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 rounded bg-slate-800" />
        <ul className="relative z-10 flex flex-col gap-3">
          {layers.map(n => {
            const enabled = n <= current;
            const active  = n === viewed;
            return (
              <li key={n} className="flex items-center gap-2">
                <button
                  disabled={!enabled}
                  onClick={()=> onView(n)}
                  className={[
                    "h-6 w-6 rounded-full border transition",
                    active ? "bg-cyan-400 border-cyan-300" :
                    enabled ? "bg-slate-700 border-slate-500 hover:ring-2 hover:ring-cyan-400/40" :
                              "bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed"
                  ].join(" ")}
                  title={enabled ? `View Layer ${n}` : "Locked"}
                />
                <span className={[
                  "text-xs",
                  active ? "text-cyan-300" : enabled ? "text-slate-300" : "text-slate-600"
                ].join(" ")}>L{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-3 text-[10px] text-slate-400">
        Viewing L{viewed} {editMode && <span className="text-amber-300">(Edit)</span>}
      </div>
    </aside>
  );
}
