"use client";
import { useEffect, useId, useState } from "react";

type Side = "left" | "right";

export default function Hint({
  title,
  children,
  preferredSide = "right",
}: {
  title: string;
  children: React.ReactNode;
  preferredSide?: Side;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== id) setOpen(false);
    };
    window.addEventListener("hint:open", onOpen as EventListener);
    return () => window.removeEventListener("hint:open", onOpen as EventListener);
  }, [id]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) window.dispatchEvent(new CustomEvent("hint:open", { detail: id }));
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        className="w-4 h-4 rounded-full text-[10px] leading-4 text-slate-900 bg-cyan-400 hover:bg-cyan-300"
        aria-label={`Hint: ${title}`}
      >
        ?
      </button>

      {open && (
        <div
          className={`absolute z-40 mt-1 ${preferredSide === "right" ? "left-full ml-2" : "right-full mr-2"} 
                      w-64 max-w-[18rem] rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-lg`}
        >
          <div className="px-2 py-1.5 text-xs font-semibold border-b border-slate-700 flex items-center justify-between">
            <span className="truncate">{title}</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-2 px-1 text-slate-300 hover:text-white"
              aria-label="Close hint"
            >
              ✕
            </button>
          </div>
          <div className="p-2 text-xs text-left leading-relaxed">{children}</div>
        </div>
      )}
    </span>
  );
}
