"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Heart, Plus, RefreshCw, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardResult } from "@/app/api/ai/plan-wizard/route";
import type { Dish } from "@/types/database";

export type WizardDay = {
  date: string;
  shortName: string;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  isEmpty: boolean;
};

type Protein = WizardResult["proteins"][number];
type Suggestions = Pick<WizardResult, "favoriteSuggestions" | "newIdeas">;
type Suggestion = { name: string; reason: string; badge?: string; kind: "favorite" | "idea" };

type Props = {
  open: boolean;
  familyId: string;
  days: WizardDay[];
  dishes: Pick<Dish, "id" | "name">[];
  onClose: () => void;
  onAssignDish: (date: string, dishId: string) => Promise<unknown>;
  onAssignCustom: (date: string, name: string) => Promise<unknown>;
  onSaveToLibrary: (name: string) => Promise<unknown>;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function PlanningWizard({
  open,
  familyId,
  days,
  dishes,
  onClose,
  onAssignDish,
  onAssignCustom,
  onSaveToLibrary,
}: Props) {
  // Phase 1: fast pantry fetch (~200 ms)
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [loadingProteins, setLoadingProteins] = useState(false);

  // Phase 2: AI suggestions (~3-5 s)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pantryOpen, setPantryOpen] = useState(false);

  // Interaction state
  const [planned, setPlanned] = useState<Record<string, string>>({});
  const [plannedDates, setPlannedDates] = useState<Set<string>>(new Set());
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [autoFilling, setAutoFilling] = useState(false);
  const [justFilled, setJustFilled] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragOffset = useRef(0);

  const loadProteins = useCallback(async () => {
    setLoadingProteins(true);
    try {
      const res = await fetch("/api/pantry/proteins", {
        headers: { "x-family-id": familyId },
      });
      if (res.ok) setProteins(await res.json());
    } finally {
      setLoadingProteins(false);
    }
  }, [familyId]);

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
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
      const data: WizardResult = await res.json();
      setSuggestions({ favoriteSuggestions: data.favoriteSuggestions, newIdeas: data.newIdeas });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  }, [familyId]);

  useEffect(() => {
    if (open) {
      // Fire both fetches concurrently — proteins will arrive first
      loadProteins();
      loadSuggestions();
    } else {
      setProteins([]);
      setSuggestions(null);
      setError(null);
      setPantryOpen(false);
      setPlanned({});
      setPlannedDates(new Set());
      setOpenPicker(null);
      setSaved(new Set());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const availableDays = days.filter((d) => d.isEmpty && !plannedDates.has(d.date));

  const allSuggestions: Suggestion[] = suggestions
    ? [
        ...suggestions.favoriteSuggestions.map((s) => ({
          name: s.name,
          reason: s.reason,
          badge: s.matchingPantryItem ?? undefined,
          kind: "favorite" as const,
        })),
        ...suggestions.newIdeas.map((s) => ({
          name: s.name,
          reason: s.reason,
          badge: s.protein,
          kind: "idea" as const,
        })),
      ]
    : [];

  const unplannedCount = allSuggestions.filter((s) => !planned[s.name]).length;
  const autoFillCount = Math.min(availableDays.length, unplannedCount);

  async function planSuggestion(s: Suggestion, day: WizardDay) {
    const dish = dishes.find((d) => d.name.toLowerCase() === s.name.toLowerCase());
    if (dish) await onAssignDish(day.date, dish.id);
    else await onAssignCustom(day.date, s.name);
    setPlanned((prev) => ({ ...prev, [s.name]: day.shortName }));
    setPlannedDates((prev) => new Set(prev).add(day.date));
    setJustFilled(day.date);
    setTimeout(() => setJustFilled(null), 700);
  }

  async function handlePick(s: Suggestion, day: WizardDay) {
    setOpenPicker(null);
    await planSuggestion(s, day);
  }

  async function handleAutoFill() {
    if (autoFilling) return;
    setAutoFilling(true);
    setOpenPicker(null);
    const targets = days.filter((d) => d.isEmpty && !plannedDates.has(d.date));
    const picks = allSuggestions.filter((s) => !planned[s.name]);
    const usedDates = new Set(plannedDates);
    let ti = 0;
    for (const s of picks) {
      while (ti < targets.length && usedDates.has(targets[ti].date)) ti++;
      if (ti >= targets.length) break;
      const day = targets[ti];
      usedDates.add(day.date);
      ti++;
      await planSuggestion(s, day);
      await delay(220);
    }
    setAutoFilling(false);
  }

  async function handleSave(name: string) {
    setSaved((prev) => new Set(prev).add(name));
    await onSaveToLibrary(name);
  }

  // Drag-to-dismiss
  function onTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff < 0) return;
    dragOffset.current = diff;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${diff}px)`;
  }
  function onTouchEnd() {
    if (dragOffset.current > 100) onClose();
    if (sheetRef.current) sheetRef.current.style.transform = "";
    dragStartY.current = null;
    dragOffset.current = 0;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-card shadow-warm-lg animate-slide-up transition-transform"
      >
        {/* Drag handle */}
        <div
          className="flex shrink-0 flex-col items-center pt-2 touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-5 pb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient text-lg shadow-accent-glow">
              ✨
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-text">Planning Wizard</h2>
              <p className="text-xs text-text-muted">Tap a pick to drop it on a night</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(suggestions || error) && !loadingSuggestions && (
              <button
                onClick={() => { loadProteins(); loadSuggestions(); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-card-header hover:text-accent"
                aria-label="Refresh suggestions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-card-header"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] space-y-5">

          {/* ── Week strip — rendered immediately from props, no API needed ── */}
          <WeekStrip days={days} plannedDates={plannedDates} justFilled={justFilled} />

          {/* ── Auto-fill button — always visible, enabled once suggestions arrive ── */}
          <button
            onClick={handleAutoFill}
            disabled={autoFillCount === 0 || autoFilling || loadingSuggestions}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition-all active:scale-[0.98]",
              autoFillCount === 0 || autoFilling || loadingSuggestions
                ? "bg-card-header text-text-muted"
                : "bg-accent-gradient text-white shadow-accent-glow hover:brightness-[1.04]"
            )}
          >
            <Wand2 className={cn("h-5 w-5", (autoFilling || loadingSuggestions) && "animate-pulse")} />
            {autoFilling
              ? "Filling your week…"
              : loadingSuggestions
              ? "Asking the AI chef…"
              : autoFillCount === 0
              ? availableDays.length === 0
                ? "Every night is planned 🎉"
                : "Add more picks to auto-fill"
              : `Auto-fill ${autoFillCount} empty night${autoFillCount !== 1 ? "s" : ""}`}
          </button>

          {/* ── Phase 1: Proteins on hand (fast DB query, ~200 ms) ── */}
          {loadingProteins ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-32 rounded-full bg-card-header" />
              <div className="flex gap-2">
                <div className="h-8 w-28 rounded-full bg-card-header" />
                <div className="h-8 w-24 rounded-full bg-card-header" />
                <div className="h-8 w-20 rounded-full bg-card-header" />
              </div>
            </div>
          ) : proteins.length > 0 ? (
            <section>
              <SectionLabel icon="🥩" label="Proteins on hand" />
              <div className="mt-2 flex flex-wrap gap-2">
                {proteins.map((p) => (
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
          ) : null}

          {/* Pantry snapshot collapsible — show as soon as proteins loaded */}
          {!loadingProteins && (
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
                <span className="text-sm font-semibold text-text">Full pantry snapshot</span>
                {!pantryOpen && (
                  <span className="ml-auto text-xs text-text-muted">
                    {proteins.length === 0
                      ? "Nothing logged yet"
                      : `${proteins.length} protein${proteins.length !== 1 ? "s" : ""} found`}
                  </span>
                )}
              </button>
              {pantryOpen && (
                <p className="mt-2 rounded-xl bg-card-header/40 px-4 py-3 text-sm text-text-secondary">
                  {proteins.length === 0
                    ? "Your pantry is empty — add items on the Pantry tab so the wizard can use them."
                    : proteins.map((p) => `${p.name} (${p.quantity} ${p.unit})`).join(" · ")}
                </p>
              )}
            </section>
          )}

          {/* ── Phase 2: AI suggestions (slow, ~3-5 s) ── */}
          {loadingSuggestions && <SuggestionsSkeleton />}

          {error && !loadingSuggestions && (
            <div className="rounded-2xl border border-red/20 bg-red/5 p-4 text-center">
              <p className="text-sm font-medium text-red">{error}</p>
              <button
                onClick={loadSuggestions}
                className="mt-3 text-sm font-semibold text-accent underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {suggestions && !loadingSuggestions && (
            <>
              {suggestions.favoriteSuggestions.length > 0 && (
                <section>
                  <SectionLabel icon="⭐" label="From your favorites" />
                  <div className="mt-2 space-y-2">
                    {suggestions.favoriteSuggestions.map((s) => (
                      <SuggestionCard
                        key={s.name}
                        name={s.name}
                        reason={s.reason}
                        badge={s.matchingPantryItem ?? undefined}
                        badgeColor="accent"
                        plannedDay={planned[s.name]}
                        pickerOpen={openPicker === s.name}
                        days={days}
                        plannedDates={plannedDates}
                        onTogglePicker={() =>
                          setOpenPicker((cur) => (cur === s.name ? null : s.name))
                        }
                        onPick={(day) =>
                          handlePick({ name: s.name, reason: s.reason, kind: "favorite" }, day)
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {suggestions.newIdeas.length > 0 && (
                <section>
                  <SectionLabel icon="💡" label="New ideas from your pantry" />
                  <div className="mt-2 space-y-2">
                    {suggestions.newIdeas.map((s) => (
                      <SuggestionCard
                        key={s.name}
                        name={s.name}
                        reason={s.reason}
                        badge={s.protein}
                        badgeColor="blue"
                        plannedDay={planned[s.name]}
                        pickerOpen={openPicker === s.name}
                        days={days}
                        plannedDates={plannedDates}
                        saved={saved.has(s.name)}
                        onSave={() => handleSave(s.name)}
                        onTogglePicker={() =>
                          setOpenPicker((cur) => (cur === s.name ? null : s.name))
                        }
                        onPick={(day) =>
                          handlePick({ name: s.name, reason: s.reason, kind: "idea" }, day)
                        }
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

function WeekStrip({
  days,
  plannedDates,
  justFilled,
}: {
  days: WizardDay[];
  plannedDates: Set<string>;
  justFilled: string | null;
}) {
  return (
    <div className="flex justify-between gap-1">
      {days.map((d) => {
        const filled = !d.isEmpty || plannedDates.has(d.date);
        const pop = justFilled === d.date;
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              {d.shortName.slice(0, 1)}
            </span>
            <span
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg text-sm font-bold transition-all duration-300",
                pop && "animate-pop-in scale-105",
                filled
                  ? "bg-accent-gradient text-white shadow-warm-sm"
                  : d.isToday
                  ? "bg-accent-light text-accent-dark ring-1 ring-accent/40"
                  : "bg-card-header/70 text-text-muted"
              )}
            >
              {filled ? <Check className="h-4 w-4" /> : d.dayNumber}
            </span>
          </div>
        );
      })}
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
  plannedDay,
  pickerOpen,
  days,
  plannedDates,
  saved,
  onSave,
  onTogglePicker,
  onPick,
}: {
  name: string;
  reason: string;
  badge?: string;
  badgeColor: "accent" | "blue";
  plannedDay?: string;
  pickerOpen: boolean;
  days: WizardDay[];
  plannedDates: Set<string>;
  saved?: boolean;
  onSave?: () => void;
  onTogglePicker: () => void;
  onPick: (day: WizardDay) => void;
}) {
  const isPlanned = !!plannedDay;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-warm-sm transition-colors",
        isPlanned ? "border-green/30 bg-green/5" : "border-border-light bg-paper/80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-text">{name}</span>
        {badge && !isPlanned && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              badgeColor === "accent" ? "bg-accent-light text-accent-dark" : "bg-blue/10 text-blue"
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{reason}</p>

      {isPlanned ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-green animate-pop-in">
          <Check className="h-4 w-4" />
          Planned for {plannedDay}
        </div>
      ) : (
        <>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={onTogglePicker}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors active:scale-95",
                pickerOpen
                  ? "bg-accent text-white"
                  : "bg-accent-light text-accent-dark hover:bg-accent/15"
              )}
            >
              <Plus className="h-4 w-4" />
              Add to plan
            </button>
            {onSave && (
              <button
                onClick={onSave}
                disabled={saved}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors active:scale-95",
                  saved
                    ? "text-green"
                    : "text-text-secondary hover:bg-card-header hover:text-accent"
                )}
              >
                <Heart className={cn("h-4 w-4", saved && "fill-green")} />
                {saved ? "Saved" : "Save"}
              </button>
            )}
          </div>

          {pickerOpen && (
            <div className="mt-2.5 animate-fade-in">
              <p className="mb-1.5 text-xs font-medium text-text-muted">Which night?</p>
              <div className="flex gap-1.5">
                {days.map((d) => {
                  const filled = !d.isEmpty || plannedDates.has(d.date);
                  return (
                    <button
                      key={d.date}
                      onClick={() => onPick(d)}
                      className={cn(
                        "flex flex-1 flex-col items-center rounded-lg py-1.5 transition-colors active:scale-95",
                        filled
                          ? "bg-card-header/60 text-text-muted hover:bg-card-header"
                          : "bg-accent-light text-accent-dark hover:bg-accent/15"
                      )}
                      title={filled ? `${d.dayName} (already has dinner)` : d.dayName}
                    >
                      <span className="text-[10px] font-bold uppercase">{d.shortName.slice(0, 3)}</span>
                      <span className="text-sm font-bold">{d.dayNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SuggestionsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {[1, 2].map((g) => (
        <div key={g} className="space-y-2">
          <div className="h-4 w-44 rounded-full bg-card-header" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-card-header/70" />
          ))}
        </div>
      ))}
      <p className="text-center text-sm text-text-muted animate-none">Asking the AI chef…</p>
    </div>
  );
}
