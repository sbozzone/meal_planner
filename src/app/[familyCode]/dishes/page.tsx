"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DishForm } from "@/components/dishes/DishForm";
import type { DishFormExtras } from "@/components/dishes/DishForm";
import { ImportUrlSheet } from "@/components/dishes/ImportUrlSheet";
import { MemoryModal } from "@/components/dishes/MemoryModal";
import { useDishes } from "@/hooks/useDishes";
import { useFamily } from "@/lib/family-context";
import { APPLIANCES, DISH_TAGS, type Dish } from "@/types/database";
import { Plus, Search, Trash2, Pencil, Link, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DishesPage() {
  const { family } = useFamily();
  const { dishes, loading, addDish, updateDish, deleteDish } = useDishes();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterAppliance, setFilterAppliance] = useState("");
  const [memoriesOnly, setMemoriesOnly] = useState(false);
  const [memoryDish, setMemoryDish] = useState<Dish | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = dishes.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || (d.tags as string[]).includes(filterTag);
    const matchesAppliance = !filterAppliance || d.appliances?.includes(filterAppliance);
    const matchesMemory = !memoriesOnly || d.is_memory;
    return matchesSearch && matchesTag && matchesAppliance && matchesMemory;
  });

  // Collect all tags across dishes — predefined first (with color), then custom
  const allUsedTagValues = [...new Set(dishes.flatMap((d) => d.tags))];
  const predefinedUsed = DISH_TAGS.filter((t) => allUsedTagValues.includes(t.value));
  const customUsed = allUsedTagValues.filter((t) => !DISH_TAGS.find((dt) => dt.value === t));

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
    const imageUrl = extras.memoryImageFile && dish
      ? await uploadMemoryPhoto(dish.id, extras.memoryImageFile)
      : extras.memory_image_url;
    const payload = {
      name,
      tags,
      ingredients,
      is_memory: extras.is_memory,
      memory_story: extras.memory_story,
      memory_image_url: imageUrl,
      appliances: extras.appliances,
    };

    if (dish) {
      await updateDish(dish.id, payload);
      return;
    }

    const created = await addDish(name, tags, ingredients, payload);
    if (created && extras.memoryImageFile) {
      const uploadedUrl = await uploadMemoryPhoto(created.id, extras.memoryImageFile);
      if (uploadedUrl) {
        await updateDish(created.id, { memory_image_url: uploadedUrl });
      }
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
          <button
            onClick={() => {
              setEditingDish(null);
              setShowForm(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-card font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all min-h-touch"
          >
            <Plus className="w-5 h-5" />
            Add Dish
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-accent/30 text-accent rounded-card font-medium text-sm hover:bg-accent-light/30 active:scale-[0.98] transition-all min-h-touch"
            title="Import from URL"
          >
            <Link className="w-4 h-4" />
            Import URL
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-card bg-card animate-pulse border border-border-light" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">
              {search
                ? "No dishes match your search"
                : "No favorites yet. Add your first dish!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center gap-3 px-4 py-3 bg-card border border-border-light rounded-card"
              >
                <button
                  onClick={() => handleEdit(dish)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3 className="font-medium text-sm text-text truncate">
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
      />

      <ImportUrlSheet
        open={showImport}
        onClose={() => setShowImport(false)}
        onSave={async (name, tags, ingredients) => {
          await addDish(name, tags, ingredients);
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
