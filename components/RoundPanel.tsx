// components/RoundPanel.tsx
"use client";

import { useMemo, useState } from "react";
import Hint from "./Hint";

/** Payload sent to parent when the player confirms the round. */
export type RoundActionPayload =
  | { type: "stabilize"; strength: number }                         // no selection required
  | { type: "beam"; mode: "auto" | "selected"; target?: number }    // 'selected' requires 1 token
  | { type: "magnetize"; anchor: number; pull: number }             // requires 1 token
  | { type: "rotate"; degrees: number }                              // no selection required
  | { type: "spread"; anchor: number; amount: number };             // requires 1 token

type Props = {
  selected?: number[];                    // indices from TempestCanvas clicks
  onExecute(action: RoundActionPayload): void;
};

export default function RoundPanel({ selected = [], onExecute }: Props) {
  type ActionKey = "stabilize" | "beam" | "magnetize" | "rotate" | "spread";

  const [action, setAction] = useState<ActionKey | null>(null);

  // Tunables (simple, parent applies real transforms)
  const [stabilizeStrength, setStabilizeStrength] = useState(25); // 5..80 (%)
  const [beamMode, setBeamMode] = useState<"auto" | "selected">("auto");
  const [magnetPull, setMagnetPull] = useState(35);               // 10..70 (%)
  const [rotateDeg, setRotateDeg] = useState(10);                 // -45..45 (deg)
  const [spreadAmt, setSpreadAmt] = useState(30);                 // 10..70 (%)

  // Validation: which actions need exactly 1 selected token?
  const needsOneSelection = useMemo(
    () => action === "magnetize" || (action === "beam" && beamMode === "selected") || action === "spread",
    [action, beamMode]
  );
  const selectionOK = !needsOneSelection || selected.length === 1;

  const disabledReason = useMemo(() => {
    if (!action) return "Pick an action.";
    if (!selectionOK) return "Select exactly one token on the wheel.";
    return null;
  }, [action, selectionOK]);

  function confirm() {
    if (!action || disabledReason) return;

    if (action === "stabilize") {
      onExecute({ type: "stabilize", strength: clamp01(stabilizeStrength / 100) });
      return;
    }
    if (action === "beam") {
      const target = beamMode === "selected" ? selected[0] : undefined;
      onExecute({ type: "beam", mode: beamMode, target });
      return;
    }
    if (action === "magnetize") {
      onExecute({ type: "magnetize", anchor: selected[0], pull: clamp01(magnetPull / 100) });
      return;
    }
    if (action === "rotate") {
      onExecute({ type: "rotate", degrees: clamp(rotateDeg, -45, 45) });
      return;
    }
    if (action === "spread") {
      onExecute({ type: "spread", anchor: selected[0], amount: clamp01(spreadAmt / 100) });
      return;
    }
  }

  return (
    <aside className="space-y-3 rounded-lg border-2 border-slate-600/70 bg-slate-950/70 p-3 text-sm shadow-[0_0_0_1px_rgba(56,189,248,0.08)]">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-200">Round action</div>
        <Hint title="How rounds work" side="left">
          Choose one action below (one per round). Some actions require selecting a single token on the wheel first.
          Learn more:{" "}
          <a className="underline text-cyan-300" href="https://en.wikipedia.org/wiki/Attention_(machine_learning)" target="_blank" rel="noreferrer">Attention</a>,{" "}
          <a className="underline text-cyan-300" href="https://en.wikipedia.org/wiki/Cosine_similarity" target="_blank" rel="noreferrer">Cosine similarity</a>,{" "}
          <a className="underline text-cyan-300" href="https://en.wikipedia.org/wiki/Vector_space_model" target="_blank" rel="noreferrer">Vector spaces</a>.
        </Hint>
      </div>

      {/* One action per ROW (equal width) */}
      <div className="flex flex-col gap-2">
        {([
          { key: "stabilize", label: "Stabilize", desc: "Nudge spokes toward even spacing (a prior)" },
          { key: "beam",      label: "Attention Beam", desc: "Boost influence globally or for a selected token" },
          { key: "magnetize", label: "Magnetize", desc: "Pull neighbors toward a selected anchor" },
          { key: "rotate",    label: "Rotate", desc: "Rotate the whole space slightly" },
          { key: "spread",    label: "Spread", desc: "Push neighbors away from a selected anchor" },
        ] as {key: ActionKey; label: string; desc: string}[]).map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => setAction(key)}
            aria-pressed={action === key}
            className={[
              "w-full text-left px-3 py-2 rounded-md border transition-colors",
              action === key
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{label}</span>
              <span className="text-[10px] opacity-75">choose</span>
            </div>
            <div className="text-[11px] text-slate-400">{desc}</div>
          </button>
        ))}
      </div>

      {/* Configurators: only after an action is selected */}
      {action && <div className="pt-2 border-t border-slate-800/60" />}

      {action === "stabilize" && (
        <Field title="Stabilize strength" help="Higher strength = larger corrective move this round.">
          <Slider value={stabilizeStrength} setValue={setStabilizeStrength} min={5} max={80} />
        </Field>
      )}

      {action === "beam" && (
        <Field title="Beam mode" help="Auto emphasizes pattern spokes; Selected aims at your chosen token (select one).">
          <Segmented
            value={beamMode}
            setValue={setBeamMode}
            options={[
              { value: "auto", label: "Auto" },
              { value: "selected", label: "Selected" },
            ]}
          />
          <div className="text-xs text-slate-400 mt-1">
            {beamMode === "selected"
              ? (selected.length === 1 ? "Target: selected token." : "Select exactly one token.")
              : "No selection required."}
          </div>
        </Field>
      )}

      {action === "magnetize" && (
        <Field title="Anchor & pull" help="Select one token as the anchor, then choose pull strength.">
          <div className="text-xs text-slate-400 mb-1">
            {selected.length === 1 ? "Anchor set from selection." : "Select exactly one token as the anchor."}
          </div>
          <Slider value={magnetPull} setValue={setMagnetPull} min={10} max={70} />
        </Field>
      )}

      {action === "rotate" && (
        <Field title="Degrees" help="Positive = counter-clockwise. Keep moves small for clarity.">
          <Slider value={rotateDeg} setValue={setRotateDeg} min={-45} max={45} />
        </Field>
      )}

      {action === "spread" && (
        <Field title="Anchor & amount" help="Select one token; neighbors are gently pushed away along their angles.">
          <div className="text-xs text-slate-400 mb-1">
            {selected.length === 1 ? "Anchor set from selection." : "Select exactly one token as the anchor."}
          </div>
          <Slider value={spreadAmt} setValue={setSpreadAmt} min={10} max={70} />
        </Field>
      )}

      <div className="flex items-center justify-end">
        <button
          onClick={confirm}
          disabled={!!disabledReason}
          title={disabledReason ?? ""}
          className={[
            "px-3 py-2 rounded-md",
            disabledReason
              ? "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
              : "bg-fuchsia-400 text-black hover:bg-fuchsia-300",
          ].join(" ")}
        >
          Done — next round
        </button>
      </div>
    </aside>
  );
}

/* ----------------------------- UI helpers ----------------------------- */

function Field({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-800 p-2 bg-slate-900/60">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-slate-200 text-sm">{title}</div>
        {help && (
          <Hint title={title} side="left">
            {help}
          </Hint>
        )}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  setValue,
  options,
}: {
  value: T;
  setValue: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => setValue(o.value)}
          className={[
            "px-2 py-1 text-xs",
            value === o.value ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700",
            i !== 0 ? "border-l border-slate-700" : "",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  value,
  setValue,
  min = 0,
  max = 100,
}: {
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseFloat(e.currentTarget.value))}
        className="flex-1 accent-cyan-400"
      />
      <div className="w-14 text-right text-xs text-slate-300">{value}</div>
    </div>
  );
}

/* ----------------------------- utils ----------------------------- */
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function clamp(x: number, a: number, b: number) { return Math.max(a, Math.min(b, x)); }
