"use client";

import { BottomSheet } from "@/components/shared/BottomSheet";
import type { Dish } from "@/types/database";
import { Pencil } from "lucide-react";

export function MemoryModal({
  dish,
  open,
  onClose,
  onEdit,
}: {
  dish: Dish | null;
  open: boolean;
  onClose: () => void;
  onEdit: (dish: Dish) => void;
}) {
  if (!dish) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={dish.name}>
      <div className="space-y-4 p-5">
        {dish.memory_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.memory_image_url}
            alt={`${dish.name} memory`}
            className="max-h-80 w-full rounded-card border border-border-light object-cover"
          />
        )}
        <p className="font-serif text-lg leading-relaxed text-text">
          {dish.memory_story || "No story has been added yet."}
        </p>
        <button
          onClick={() => onEdit(dish)}
          className="flex min-h-touch w-full items-center justify-center gap-2 rounded-card bg-accent text-white font-semibold"
        >
          <Pencil className="w-4 h-4" />
          Edit story
        </button>
      </div>
    </BottomSheet>
  );
}
