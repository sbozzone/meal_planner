"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Sparkles, Loader2, ChevronLeft, ExternalLink } from "lucide-react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { DISH_TAGS, FUN_OPTIONS, type Dish } from "@/types/database";
import { useFamily } from "@/lib/family-context";
import { cn, recipeSearchUrl } from "@/lib/utils";

interface Suggestion {
  name: string;
  fromLibrary: boolean;
  reason: string;
}

type View = "list" | "suggest";

export function DishPicker({
  open,
  date,
  onClose,
  dishes,
  onSelect,
  onAddNew,
  onAddAndSelect,
  onSelectCustom,
}: {
  open: boolean;
  date: string | null;
  onClose: () => void;
  dishes: Dish[];
  onSelect: (dish: Dish) => void;
  onAddNew: () => void;
  onAddAndSelect: (name: string) => Promise<void>;
  onSelectCustom: (name: string) => Promise<void>;
}) {
  const { family } = useFamily();
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setFilterTag(null);
      setView("list");
      setSuggestions([]);
      setSuggestError(null);
    }
  }, [open]);

  const filtered = useMemo(
    () =>
      dishes.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !filterTag || (d.tags as string[]).includes(filterTag);
        return matchesSearch && matchesTag;
      }),
    [dishes, search, filterTag]
  );

  // Only show tags that are actually used
  const allUsedTags = useMemo(() => [...new Set(dishes.flatMap((d) => d.tags))], [dishes]);
  const predefinedUsed = useMemo(
    () => DISH_TAGS.filter((t) => allUsedTags.includes(t.value)),
    [allUsedTags]
  );

  async function handleSuggest() {
    setView("suggest");
    if (suggestions.length > 0) return; // already loaded
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-id": family.id,
        },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestError(data.error || "Failed to get suggestions");
      } else {
        setSuggestions(data.suggestions);
      }
    } catch {
      setSuggestError("Network error — please try again");
    } finally {
      setSuggesting(false);
    }
  }

  async function handlePickSuggestion(suggestion: Suggestion) {
    if (suggestion.fromLibrary) {
      const match = dishes.find(
        (d) => d.name.toLowerCase() === suggestion.name.toLowerCase()
      );
      if (match) {
        onSelect(match);
        onClose();
        return;
      }
    }
    // New dish — add to library then assign
    setAddingName(suggestion.name);
    try {
      await onAddAndSelect(suggestion.name);
      onClose();
    } finally {
      setAddingName(null);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={view === "suggest" ? "Suggestions" : "Pick a dish"}>
      {view === "suggest" ? (
        <div className="px-4 pb-4">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to dish list
          </button>

          {suggesting && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <p className="text-sm text-text-muted">Thinking of ideas…</p>
            </div>
          )}

          {suggestError && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-red-500">{suggestError}</p>
              <button
                onClick={() => { setSuggestions([]); handleSuggest(); }}
                className="text-sm text-accent font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {!suggesting && !suggestError && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((s, i) => {
                const libraryMatch = dishes.find(
                  (d) => d.name.toLowerCase() === s.name.toLowerCase()
                );
                const inLibrary = Boolean(libraryMatch);
                const recipeUrl = libraryMatch?.source_url || recipeSearchUrl(s.name);
                const hasSavedRecipe = Boolean(libraryMatch?.source_url);
                const isAdding = addingName === s.name;
                return (
                  <div
                    key={i}
                    className="rounded-card border border-border-light bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text">{s.name}</p>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          {s.reason}
                        </p>
                        <a
                          href={recipeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {hasSavedRecipe ? "View recipe" : "Find recipe"}
                        </a>
                      </div>
                      {inLibrary && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-accent-light/60 text-accent font-medium">
                          In library
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handlePickSuggestion(s)}
                      disabled={isAdding}
                      className="mt-3 w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isAdding
                        ? "Adding…"
                        : inLibrary
                        ? "Use this dish"
                        : "Add to library & use"}
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => { setSuggestions([]); handleSuggest(); }}
                className="w-full py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-card transition-colors"
              >
                Get new suggestions
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 py-3 space-y-3">
            {/* Suggest button */}
            <button
              onClick={handleSuggest}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-accent/30 bg-accent-light/20 text-accent text-sm font-medium hover:bg-accent-light/40 active:scale-[0.98] transition-all min-h-touch"
            >
              <Sparkles className="w-4 h-4" />
              Suggest something for me
            </button>

            {/* Fun quick-pick options */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {FUN_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={async () => {
                    await onSelectCustom(opt.label);
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card-header border border-border text-text-secondary hover:border-accent/40 hover:text-accent hover:bg-accent-light/30 transition-colors text-sm font-medium min-h-[36px]"
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm placeholder:text-text-muted"
                autoFocus
              />
            </div>

            {predefinedUsed.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {predefinedUsed.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() =>
                      setFilterTag((prev) =>
                        prev === tag.value ? null : tag.value
                      )
                    }
                    className={cn(
                      "shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors min-h-[36px]",
                      filterTag === tag.value
                        ? "text-white border-transparent"
                        : "border-border text-text-secondary bg-card hover:border-accent/40"
                    )}
                    style={
                      filterTag === tag.value
                        ? { backgroundColor: tag.color }
                        : undefined
                    }
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={() => {
                onClose();
                onAddNew();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 mb-2 border-2 border-dashed border-accent/30 rounded-lg text-accent hover:bg-accent-light/30 transition-colors min-h-touch"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">Add new dish</span>
            </button>

            {filtered.length === 0 ? (
              <p className="text-center text-text-muted py-8 text-sm">
                {search ? "No dishes match your search" : "No dishes yet"}
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => {
                      onSelect(dish);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-header active:bg-border-light transition-colors text-left min-h-touch"
                  >
                    <span className="flex-1 font-medium text-sm text-text">
                      {dish.name}
                    </span>
                    {dish.tags.length > 0 && (
                      <div className="flex gap-1">
                        {(dish.tags as string[]).slice(0, 2).map((tag) => {
                          const tagDef = DISH_TAGS.find((t) => t.value === tag);
                          return (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: tagDef
                                  ? `${tagDef.color}18`
                                  : "#DDD8CC",
                                color: tagDef?.color || "#7A6F5E",
                              }}
                            >
                              {tagDef?.label || tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
