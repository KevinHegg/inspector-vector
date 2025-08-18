"use client";
import EnergyMeter from "./EnergyMeter";

type Props = {
  energy: number;
  onAdvance(): void;
  onRetry(): void;
  onCashOut(): void;
};

export default function ActionsPanel({ energy, onAdvance, onRetry, onCashOut }: Props) {
  return (
    <aside className="space-y-4">
      <EnergyMeter value={energy} hintSide="left" />

      <div className="space-y-2">
        <button onClick={onAdvance}
          className="w-full px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400">
          Advance Layer
        </button>
        <button onClick={onRetry}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
          Retry Layer
        </button>
        <button onClick={onCashOut}
          className="w-full px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300">
          Cash Out
        </button>
      </div>
    </aside>
  );
}
