"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { DISH_TAGS } from "@/types/database";
import { Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  name: string;
  tags: string[];
  reason: string;
}

export function DishSuggestSheet({
  open,
  familyId,
  onClose,
  onAdd,
}: {
  open: boolean;
  familyId: string;
  onClose: () => void;
  onAdd: (name: string, tags: string[]) => Promise<void>;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest-dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-id": familyId,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get suggestions");
      }
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setAdded(new Set());
      fetchSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAdd(suggestion: Suggestion) {
    if (adding || added.has(suggestion.name)) return;
    setAdding(suggestion.name);
    try {
      await onAdd(suggestion.name, suggestion.tags);
      setAdded((prev) => new Set(prev).add(suggestion.name));
    } finally {
      setAdding(null);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Dish Ideas for You">
      <div className="px-5 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card-header animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-red">{error}</p>
            <button
              onClick={fetchSuggestions}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {suggestions.map((s) => {
                const isAdded = added.has(s.name);
                const isAdding = adding === s.name;
                return (
                  <div
                    key={s.name}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border-light"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text">{s.name}</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{s.reason}</p>
                      {s.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {s.tags.slice(0, 4).map((tag) => {
                            const tagDef = DISH_TAGS.find((t) => t.value === tag);
                            return (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: tagDef ? `${tagDef.color}18` : "#DDD8CC",
                                  color: tagDef?.color || "#7A6F5E",
                                }}
                              >
                                {tagDef?.label || tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(s)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        "shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all",
                        isAdded
                          ? "bg-green-100 text-green-600"
                          : isAdding
                          ? "bg-accent/20 text-accent"
                          : "bg-accent text-white hover:bg-accent-hover active:scale-95"
                      )}
                      aria-label={isAdded ? "Added" : `Add ${s.name}`}
                    >
                      {isAdded ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Plus className={cn("w-5 h-5", isAdding && "animate-spin")} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={fetchSuggestions}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-card-header transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Get new suggestions
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
