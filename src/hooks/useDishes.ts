"use client";

import { useState, useEffect, useCallback } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import type { Dish, Ingredient } from "@/types/database";

export function useDishes() {
  const { family } = useFamily();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { "x-family-id": family.id };

  const fetchDishes = useCallback(async () => {
    const res = await fetch("/api/dishes", { headers });
    if (res.ok) {
      setDishes(await res.json());
    }
    setLoading(false);
  }, [family.id]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dishes-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dishes", filter: `family_id=eq.${family.id}` },
        () => { fetchDishes(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addDish(name: string, tags: string[] = [], ingredients: Ingredient[] = []) {
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name, tags, ingredients }),
    });
    if (res.ok) {
      const dish = await res.json();
      setDishes((prev) => [...prev, dish].sort((a, b) => a.name.localeCompare(b.name)));
      return dish;
    }
    return null;
  }

  async function updateDish(id: string, updates: Partial<Dish>) {
    const res = await fetch(`/api/dishes/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setDishes((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
      return updated;
    }
    return null;
  }

  async function deleteDish(id: string) {
    const res = await fetch(`/api/dishes/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setDishes((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return { dishes, loading, addDish, updateDish, deleteDish, refetch: fetchDishes };
}
