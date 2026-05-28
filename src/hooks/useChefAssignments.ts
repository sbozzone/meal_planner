"use client";

import { useState, useEffect, useCallback } from "react";
import { useFamily } from "@/lib/family-context";
import type { ChefAssignment } from "@/types/database";

export function useChefAssignments(weekStart: string) {
  const { family } = useFamily();
  const [assignments, setAssignments] = useState<ChefAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { "x-family-id": family.id };

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/chef?weekStart=${weekStart}`, { headers });
    if (res.ok) setAssignments(await res.json());
    setLoading(false);
  }, [family.id, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  async function setChef(date: string, name: string) {
    const res = await fetch("/api/chef", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ chef_date: date, chef_name: name }),
    });
    if (res.ok) {
      const saved: ChefAssignment = await res.json();
      setAssignments((prev) => [
        ...prev.filter((a) => a.chef_date !== date),
        saved,
      ]);
    }
  }

  async function clearChef(date: string) {
    const res = await fetch(`/api/chef/${date}`, { method: "DELETE", headers });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.chef_date !== date));
    }
  }

  return { assignments, loading, setChef, clearChef };
}
