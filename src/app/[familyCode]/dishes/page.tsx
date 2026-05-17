"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DishForm } from "@/components/dishes/DishForm";
import { useDishes } from "@/hooks/useDishes";
import { useFamily } from "@/lib/family-context";
import { DISH_TAGS, type Dish, type DishTag } from "@/types/database";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DishesPage() {
  const { family } = useFamily();
  const { dishes, loading, addDish, updateDish, deleteDish } = useDishes();
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<DishTag | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = dishes.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || d.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const usedTags = DISH_TAGS.filter((t) =>
    dishes.some((d) => d.tags.includes(t.value))
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

        {usedTags.length > 0 && (
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
            {usedTags.map((tag) => (
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
                    ? "border-accent bg-accent text-white"
                    : "border-border text-text-secondary bg-card"
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setEditingDish(null);
            setShowForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-card font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all min-h-touch"
        >
          <Plus className="w-5 h-5" />
          Add New Dish
        </button>

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
                    <div className="flex gap-1 mt-1">
                      {dish.tags.slice(0, 3).map((tag) => {
                        const tagDef = DISH_TAGS.find(
                          (t) => t.value === tag
                        );
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
        onSave={async (name, tags, ingredients) => {
          if (editingDish) {
            await updateDish(editingDish.id, { name, tags, ingredients });
          } else {
            await addDish(name, tags, ingredients);
          }
        }}
        initialName={editingDish?.name}
        initialTags={editingDish?.tags}
        initialIngredients={editingDish?.ingredients}
      />
    </>
  );
}
