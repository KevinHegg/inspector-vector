"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  label?: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** desired side; "auto" flips to keep in viewport */
  side?: "auto" | "left" | "right";
};

export default function Hint({
  label = "?",
  title,
  children,
  open,
  onOpenChange,
  side = "auto",
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const shown = typeof open === "boolean" ? open : internalOpen;

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = () => (typeof open === "boolean" ? onOpenChange?.(false) : setInternalOpen(false));
  const toggle = () =>
    typeof open === "boolean" ? onOpenChange?.(!open) : setInternalOpen((o) => !o);

  // compute fixed position to avoid clipping by parents
  useLayoutEffect(() => {
    if (!shown || !btnRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const ph = 12; // padding horizontally
    const pw = 288; // pop width (tailwind w-72)
    const top = b.top + b.height + 6; // below button
    let desired = side;
    if (side === "auto") {
      desired = b.right + pw + ph > vw ? "left" : "right";
    }
    const left = desired === "left" ? Math.max(ph, b.right - pw) : Math.min(vw - pw - ph, b.left);
    setPos({ top, left });
  }, [shown, side]);

  useEffect(() => {
    if (!shown) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [shown]);

  return (
    <span className="relative inline-block">
      <button
        ref={btnRef}
        aria-expanded={shown}
        className="h-5 w-5 rounded-full bg-slate-700 text-slate-200 text-xs leading-5
                   hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        onClick={toggle}
      >
        {label}
      </button>

      {shown && pos && (
        <div
          ref={popRef}
          role="dialog"
          aria-modal="false"
          className="fixed z-40 w-72 max-w-[min(18rem,calc(100vw-1rem))] rounded-md
                     border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 shadow-xl"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-semibold">{title}</div>
            <button
              aria-label="Close hint"
              className="h-5 w-5 rounded-full bg-slate-700 hover:bg-slate-600 text-[11px] leading-5"
              onClick={close}
            >
              ×
            </button>
          </div>
          <div className="text-slate-300">{children}</div>
        </div>
      )}
    </span>
  );
}
