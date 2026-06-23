"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { DishForm } from "@/components/dishes/DishForm";
import type { DishFormExtras } from "@/components/dishes/DishForm";
import { ImportUrlSheet } from "@/components/dishes/ImportUrlSheet";
import { MemoryModal } from "@/components/dishes/MemoryModal";
import { DishSuggestSheet } from "@/components/dishes/DishSuggestSheet";
import { useDishes } from "@/hooks/useDishes";
import { useFamily } from "@/lib/family-context";
import { APPLIANCES, DISH_TAGS, type Dish } from "@/types/database";
import { Plus, Search, Trash2, Pencil, Link, Sparkles, Wand2 } from "lucide-react";
import { cn, dishAvatarGradient, getMealEmoji } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DishesPage() {
  const { family } = useFamily();
  const { dishes, loading, addDish, updateDish, deleteDish, refetch } = useDishes();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterAppliance, setFilterAppliance] = useState("");
  const [memoriesOnly, setMemoriesOnly] = useState(false);
  const [memoryDish, setMemoryDish] = useState<Dish | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);

  const filtered = useMemo(
    () =>
      dishes.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !filterTag || (d.tags as string[]).includes(filterTag);
        const matchesAppliance = !filterAppliance || d.appliances?.includes(filterAppliance);
        const matchesMemory = !memoriesOnly || d.is_memory;
        return matchesSearch && matchesTag && matchesAppliance && matchesMemory;
      }),
    [dishes, search, filterTag, filterAppliance, memoriesOnly]
  );

  // Collect all tags across dishes — predefined first (with color), then custom
  const allUsedTagValues = useMemo(
    () => [...new Set(dishes.flatMap((d) => d.tags))],
    [dishes]
  );
  const predefinedUsed = useMemo(
    () => DISH_TAGS.filter((t) => allUsedTagValues.includes(t.value)),
    [allUsedTagValues]
  );
  const customUsed = useMemo(
    () => allUsedTagValues.filter((t) => !DISH_TAGS.find((dt) => dt.value === t)),
    [allUsedTagValues]
  );

  function handleEdit(dish: Dish) {
    setEditingDish(dish);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      deleteDish(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  async function uploadMemoryPhoto(dishId: string, file: File) {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`/api/dishes/${dishId}/memory/upload`, {
      method: "POST",
      headers: { "x-family-id": family.id },
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.memoryImageUrl as string;
  }

  async function saveDish(
    name: string,
    tags: string[],
    ingredients: Dish["ingredients"],
    extras: DishFormExtras,
    dish?: Dish | null
  ) {
    const payload = {
      name,
      tags,
      ingredients,
      is_memory: extras.is_memory,
      memory_story: extras.memory_story,
      memory_image_url: extras.memoryImageFile ? null : extras.memory_image_url,
      appliances: extras.appliances,
      source_url: extras.source_url,
      instructions: extras.instructions,
      prep_time: extras.prep_time,
      cook_time: extras.cook_time,
      servings: extras.servings,
    };

    if (dish) {
      await updateDish(dish.id, payload);
      if (extras.memoryImageFile) {
        await uploadMemoryPhoto(dish.id, extras.memoryImageFile);
        await refetch();
      }
      return;
    }

    const created = await addDish(name, tags, ingredients, payload);
    if (created && extras.memoryImageFile) {
      await uploadMemoryPhoto(created.id, extras.memoryImageFile);
      await refetch();
    }
  }

  return (
    <>
      <Header title="Favorite Dishes" familyCode={family.share_code} />

      <div className="px-4 py-3 max-w-3xl mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm placeholder:text-text-muted"
          />
        </div>

        {allUsedTagValues.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilterTag(null)}
              className={cn(
                "shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors min-h-[36px]",
                !filterTag
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary bg-card"
              )}
            >
              All
            </button>
            {predefinedUsed.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setFilterTag((prev) => prev === tag.value ? null : tag.value)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors min-h-[36px]",
                  filterTag === tag.value
                    ? "text-white border-transparent"
                    : "border-border text-text-secondary bg-card"
                )}
                style={filterTag === tag.value ? { backgroundColor: tag.color } : undefined}
              >
                {tag.label}
              </button>
            ))}
            {customUsed.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag((prev) => prev === tag ? null : tag)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors min-h-[36px]",
                  filterTag === tag
                    ? "border-accent bg-accent text-white"
                    : "border-border text-text-secondary bg-card"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={filterAppliance}
            onChange={(e) => setFilterAppliance(e.target.value)}
            className="min-h-touch rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-secondary"
          >
            <option value="">All appliances</option>
            {APPLIANCES.map((appliance) => (
              <option key={appliance} value={appliance}>
                {appliance}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMemoriesOnly((prev) => !prev)}
            className={cn(
              "flex min-h-touch items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
              memoriesOnly
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-text-secondary"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Memories only
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setEditingDish(null);
              setShowForm(true);
            }}
            className="flex-1"
          >
            <Plus className="w-5 h-5" />
            Add Dish
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowImport(true)}
            className="flex-1 text-accent"
            title="Import from URL"
          >
            <Link className="w-4 h-4 shrink-0" />
            Import
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowSuggest(true)}
            className="flex-1 text-accent"
            title="AI dish suggestions"
          >
            <Wand2 className="w-4 h-4 shrink-0" />
            Suggest
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-card bg-card animate-pulse border border-border-light" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="🍳"
            title={search ? "No matches" : "No favorites yet"}
            description={
              search
                ? "Try a different search or clear your filters."
                : "Save your family's go-to dinners here to plan the week in seconds."
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((dish, index) => (
              <div
                key={dish.id}
                className="card-surface animate-rise flex items-center gap-3 px-3.5 py-3 transition-shadow hover:shadow-warm"
                style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
              >
                <button
                  onClick={() => handleEdit(dish)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-hairline transition-transform active:scale-90"
                  style={{ background: dishAvatarGradient(dish.name) }}
                  aria-hidden
                  tabIndex={-1}
                >
                  {getMealEmoji(dish.name) ?? "🍽️"}
                </button>
                <button
                  onClick={() => handleEdit(dish)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3 className="font-semibold text-sm text-text truncate">
                    {dish.name}
                  </h3>
                  {dish.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {dish.tags.slice(0, 4).map((tag) => {
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
                  {dish.is_memory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemoryDish(dish);
                      }}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-1 text-[10px] font-semibold text-gold"
                    >
                      <Sparkles className="w-3 h-3" />
                      Memory
                    </button>
                  )}
                  {dish.appliances?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dish.appliances.slice(0, 3).map((appliance) => (
                        <span
                          key={appliance}
                          className="rounded-full bg-card-header px-1.5 py-0.5 text-[10px] text-text-secondary"
                        >
                          {appliance}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
                {dish.source_url && (
                  <a
                    href={dish.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light transition-colors shrink-0"
                    aria-label={`View recipe for ${dish.name}`}
                    title="View recipe"
                  >
                    <Link className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleEdit(dish)}
                  className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light transition-colors shrink-0"
                  aria-label={`Edit ${dish.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dish.id)}
                  className={cn(
                    "p-2 rounded-lg transition-colors shrink-0",
                    confirmDeleteId === dish.id
                      ? "text-white bg-red"
                      : "text-text-muted hover:text-red hover:bg-red/5"
                  )}
                  aria-label={confirmDeleteId === dish.id ? `Confirm delete ${dish.name}` : `Delete ${dish.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DishForm
        key={editingDish?.id ?? "new"}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingDish(null);
        }}
        onSave={async (name, tags, ingredients, extras) => {
          await saveDish(name, tags, ingredients, extras, editingDish);
        }}
        initialName={editingDish?.name}
        initialTags={editingDish?.tags}
        initialIngredients={editingDish?.ingredients}
        initialIsMemory={editingDish?.is_memory}
        initialMemoryStory={editingDish?.memory_story}
        initialMemoryImageUrl={editingDish?.memory_image_url}
        initialAppliances={editingDish?.appliances}
        initialSourceUrl={editingDish?.source_url}
        initialInstructions={editingDish?.instructions}
        initialPrepTime={editingDish?.prep_time}
        initialCookTime={editingDish?.cook_time}
        initialServings={editingDish?.servings}
      />

      <ImportUrlSheet
        open={showImport}
        onClose={() => setShowImport(false)}
        onSave={async (name, tags, ingredients, sourceUrl, recipeDetails) => {
          await addDish(name, tags, ingredients, {
            source_url: sourceUrl,
            ...recipeDetails,
          });
        }}
      />

      <DishSuggestSheet
        open={showSuggest}
        familyId={family.id}
        dishes={dishes}
        onClose={() => setShowSuggest(false)}
        onAdd={async (name, tags) => {
          await addDish(name, tags, []);
        }}
      />

      <MemoryModal
        dish={memoryDish}
        open={memoryDish !== null}
        onClose={() => setMemoryDish(null)}
        onEdit={(dish) => {
          setMemoryDish(null);
          handleEdit(dish);
        }}
      />
    </>
  );
}
