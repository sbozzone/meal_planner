"use client";

import { useCallback, useEffect, useState } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import type { PantryItem } from "@/types/database";

export type PantryInput = {
  name: string;
  quantity: number | string;
  unit: string;
  category: string;
  expiryDate?: string;
  lowStockThreshold?: number | string;
  notes?: string;
};

export function usePantry() {
  const { family } = useFamily();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { "x-family-id": family.id };

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/pantry", { headers });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [family.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pantry-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pantry_items", filter: `family_id=eq.${family.id}` },
        () => { fetchItems(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addItem(input: PantryInput) {
    const res = await fetch("/api/pantry", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
      return item;
    }
    return null;
  }

  async function updateItem(id: string, input: Partial<PantryInput> & { consumed?: number }) {
    const res = await fetch(`/api/pantry/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      await fetchItems();
    }
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch(`/api/pantry/${id}`, { method: "DELETE", headers });
  }

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
}
