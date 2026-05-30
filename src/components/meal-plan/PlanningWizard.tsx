"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb, RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardResult } from "@/app/api/ai/plan-wizard/route";

type Props = {
  open: boolean;
  familyId: string;
  onClose: () => void;
};

export function PlanningWizard({ open, familyId, onClose }: Props) {
  const [result, setResult] = useState<WizardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/plan-wizard", {
        method: "POST",
        headers: { "x-family-id": familyId, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    if (open && !result && !loading) load();
    if (!open) { setResult(null); setError(null); setPantryOpen(false); }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff < 0) return;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${diff}px)`;
  }
  function handleTouchEnd() {
    const diff = sheetRef.current?.style.transform
      ? parseInt(sheetRef.current.style.transform.replace(/[^0-9]/g, ""), 10) || 0
      : 0;
    if (diff > 100) { onClose(); }
    if (sheetRef.current) sheetRef.current.style.transform = "";
    dragStartY.current = null;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-card shadow-warm-lg animate-slide-up transition-transform"
      >
        {/* Drag handle */}
        <div
          className="flex shrink-0 flex-col items-center pt-2 touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient text-lg shadow-accent-glow">
              ✨
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-text">Planning Wizard</h2>
              <p className="text-xs text-text-muted">Based on your pantry &amp; history</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {result && !loading && (
              <button
                onClick={load}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-card-header hover:text-accent"
                aria-label="Refresh suggestions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-card-header"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] space-y-5">
          {loading && <LoadingSkeleton />}

          {error && (
            <div className="rounded-2xl border border-red/20 bg-red/5 p-4 text-center">
              <p className="text-sm font-medium text-red">{error}</p>
              <button
                onClick={load}
                className="mt-3 text-sm font-semibold text-accent underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Proteins on hand */}
              {result.proteins.length > 0 && (
                <section>
                  <SectionLabel icon="🥩" label="Proteins on hand" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.proteins.map((p) => (
                      <span
                        key={p.name}
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-light px-3 py-1.5 text-sm font-semibold text-accent-dark"
                      >
                        {p.name}
                        <span className="text-xs font-normal text-text-muted">
                          {p.quantity} {p.unit}
                        </span>
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Pantry toggle */}
              <section>
                <button
                  onClick={() => setPantryOpen((v) => !v)}
                  className="flex w-full items-center gap-2 rounded-xl border border-border-light bg-card-header/50 px-4 py-3 text-left transition-colors hover:bg-card-header"
                >
                  {pantryOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    Full pantry snapshot
                  </span>
                  {!pantryOpen && (
                    <span className="ml-auto text-xs text-text-muted">
                      {result.proteins.length === 0
                        ? "Nothing logged yet"
                        : `${result.proteins.length} protein${result.proteins.length !== 1 ? "s" : ""} found`}
                    </span>
                  )}
                </button>
                {pantryOpen && (
                  <p className="mt-2 rounded-xl bg-card-header/40 px-4 py-3 text-sm text-text-secondary">
                    {result.proteins.length === 0
                      ? "Your pantry is empty — add items on the Pantry tab so the wizard can use them."
                      : result.proteins
                          .map((p) => `${p.name} (${p.quantity} ${p.unit})`)
                          .join(" · ")}
                  </p>
                )}
              </section>

              {/* From your favorites */}
              {result.favoriteSuggestions.length > 0 && (
                <section>
                  <SectionLabel icon="⭐" label="From your favorites" />
                  <div className="mt-2 space-y-2">
                    {result.favoriteSuggestions.map((s) => (
                      <SuggestionCard
                        key={s.name}
                        name={s.name}
                        reason={s.reason}
                        badge={s.matchingPantryItem ?? undefined}
                        badgeColor="accent"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* New ideas */}
              {result.newIdeas.length > 0 && (
                <section>
                  <SectionLabel icon="💡" label="New ideas based on what you have" />
                  <div className="mt-2 space-y-2">
                    {result.newIdeas.map((s) => (
                      <SuggestionCard
                        key={s.name}
                        name={s.name}
                        reason={s.reason}
                        badge={s.protein}
                        badgeColor="blue"
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base leading-none">{icon}</span>
      <h3 className="font-serif text-base font-semibold text-text">{label}</h3>
    </div>
  );
}

function SuggestionCard({
  name,
  reason,
  badge,
  badgeColor,
}: {
  name: string;
  reason: string;
  badge?: string;
  badgeColor: "accent" | "blue";
}) {
  return (
    <div className="rounded-2xl border border-border-light bg-paper/80 px-4 py-3 shadow-warm-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-text">{name}</span>
        {badge && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              badgeColor === "accent"
                ? "bg-accent-light text-accent-dark"
                : "bg-blue/10 text-blue"
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{reason}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-card-header" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-full bg-card-header" />
          <div className="h-8 w-20 rounded-full bg-card-header" />
          <div className="h-8 w-28 rounded-full bg-card-header" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 rounded-full bg-card-header" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-card-header/70" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-52 rounded-full bg-card-header" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-card-header/70" />
        ))}
      </div>
      <p className="text-center text-sm text-text-muted">
        Checking your pantry and history…
      </p>
    </div>
  );
}
