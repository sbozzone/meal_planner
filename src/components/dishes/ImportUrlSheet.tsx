"use client";

import { useState } from "react";
import { Loader2, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { useFamily } from "@/lib/family-context";
import type { Ingredient } from "@/types/database";

interface ExtractedRecipe {
  name: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
  source_url: string;
}

type Step = "input" | "loading" | "review";

export function ImportUrlSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    tags: string[],
    ingredients: Ingredient[],
    sourceUrl: string | null
  ) => Promise<void>;
}) {
  const { family } = useFamily();
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<ExtractedRecipe | null>(null);
  const [editedName, setEditedName] = useState("");
  const [showIngredients, setShowIngredients] = useState(true);
  const [saving, setSaving] = useState(false);

  function reset() {
    setStep("input");
    setUrl("");
    setError(null);
    setRecipe(null);
    setEditedName("");
  }

  async function handleFetch() {
    if (!url.trim()) return;
    setStep("loading");
    setError(null);
    // Guard against a request that never resolves so the spinner can't hang forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch("/api/ai/import-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-id": family.id,
        },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to extract recipe");
        setStep("input");
        return;
      }
      setRecipe(data);
      setEditedName(data.name);
      setStep("review");
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "That took too long — try again or use a different URL"
          : "Network error — please try again"
      );
      setStep("input");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function handleSave() {
    if (!recipe || !editedName.trim()) return;
    setSaving(true);
    await onSave(editedName.trim(), recipe.tags, recipe.ingredients, recipe.source_url || null);
    setSaving(false);
    onClose();
    reset();
  }

  function handleClose() {
    onClose();
    reset();
  }

  const totalTime =
    recipe
      ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
      : 0;

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Import from URL"
    >
      <div className="p-5 space-y-4">
        {step === "input" && (
          <>
            <p className="text-sm text-text-muted">
              Paste a recipe URL from AllRecipes, Food Network, NYT Cooking, or any recipe site.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
                  className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-lg text-sm placeholder:text-text-muted"
                  autoFocus
                />
              </div>
              <button
                onClick={handleFetch}
                disabled={!url.trim()}
                className="px-4 py-3 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Import
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <p className="text-sm text-text-muted">Reading recipe…</p>
          </div>
        )}

        {step === "review" && recipe && (
          <>
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Dish name
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-base font-medium"
              />
            </div>

            {/* Meta */}
            <div className="flex gap-4 text-sm text-text-muted">
              {totalTime > 0 && (
                <span>⏱ {totalTime} min total</span>
              )}
              {recipe.servings > 0 && (
                <span>🍽 Serves {recipe.servings}</span>
              )}
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light/60 text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ingredients collapsible */}
            {recipe.ingredients.length > 0 && (
              <div className="border border-border-light rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowIngredients((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text bg-card"
                >
                  <span>{recipe.ingredients.length} ingredients extracted</span>
                  {showIngredients ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                {showIngredients && (
                  <div className="divide-y divide-border-light/50">
                    {recipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm bg-bg"
                      >
                        <span className="text-text-muted font-mono text-xs w-16 shrink-0">
                          {ing.quantity} {ing.unit}
                        </span>
                        <span className="flex-1 text-text">{ing.name}</span>
                        <span className="text-[10px] text-text-muted">
                          {ing.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setStep("input"); setRecipe(null); }}
                className="flex-1 py-3 border border-border rounded-card text-sm font-medium text-text-secondary hover:bg-card transition-colors"
              >
                Try different URL
              </button>
              <button
                onClick={handleSave}
                disabled={!editedName.trim() || saving}
                className="flex-1 py-3 bg-accent text-white rounded-card text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to library"}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
