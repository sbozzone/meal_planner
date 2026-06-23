"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import { useFamilyRefresh } from "@/hooks/useFamilyRefresh";
import type { ShoppingItem } from "@/types/database";

const CATEGORY_ORDER = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Frozen",
  "Pantry",
  "Canned Goods",
  "Condiments",
  "Snacks",
  "Beverages",
  "Other",
];

export function useShoppingList() {
  const { family } = useFamily();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({ "x-family-id": family.id }), [family.id]);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/shopping", { headers });
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useFamilyRefresh(fetchItems);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`shopping-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `family_id=eq.${family.id}` },
        () => { fetchItems(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family.id, fetchItems]);

  async function addItem(name: string) {
    const res = await fetch("/api/shopping", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      return item;
    }
    return null;
  }

  async function toggleItem(id: string, checked: boolean) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_checked: checked } : it))
    );
    await fetch(`/api/shopping/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ is_checked: checked }),
    });
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await fetch(`/api/shopping/${id}`, {
      method: "DELETE",
      headers,
    });
  }

  async function generateFromPlan(weekStart: string): Promise<{ ok: boolean; message: string }> {
    const res = await fetch("/api/shopping/generate", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    const data = await res.json();
    if (res.ok) {
      await fetchItems();
      return { ok: true, message: `Added ${data.generated} items from your meal plan` };
    }
    return { ok: false, message: data.error || "Failed to generate list" };
  }

  const uncheckedCount = useMemo(
    () => items.filter((it) => !it.is_checked).length,
    [items]
  );

  const sortedCategories = useMemo(() => {
    const categories = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return Object.entries(categories).sort(
      ([a], [b]) =>
        (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
        (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
    );
  }, [items]);

  return {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    generateFromPlan,
    uncheckedCount,
    sortedCategories,
    refetch: fetchItems,
  };
}
