"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import { getWeekDays } from "@/lib/utils";
import { useFamilyRefresh } from "@/hooks/useFamilyRefresh";
import type { MealPlan, DayPlan } from "@/types/database";

export function useMealPlan(weekStart: string) {
  const { family } = useFamily();
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({ "x-family-id": family.id }), [family.id]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/meal-plan?weekStart=${weekStart}`,
      { headers }
    );
    if (res.ok) {
      setMeals(await res.json());
    }
    setLoading(false);
  }, [headers, weekStart]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useFamilyRefresh(fetchMeals);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`meal-plans-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_plans", filter: `family_id=eq.${family.id}` },
        () => { fetchMeals(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family.id, fetchMeals]);

  const days: DayPlan[] = getWeekDays(weekStart).map((day) => ({
    ...day,
    meals: meals.filter((m) => m.meal_date === day.date),
  }));

  async function assignCustomMeal(date: string, name: string) {
    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ custom_name: name, meal_date: date }),
    });
    if (res.ok) {
      const meal = await res.json();
      setMeals((prev) => [...prev, meal]);
      return meal;
    }
    return null;
  }

  async function assignDish(date: string, dishId: string) {
    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ dish_id: dishId, meal_date: date }),
    });
    if (res.ok) {
      const meal = await res.json();
      setMeals((prev) => [...prev, meal]);
      return meal;
    }
    return null;
  }

  async function removeMeal(mealId: string) {
    const res = await fetch(`/api/meal-plan/${mealId}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    }
  }

  async function clearWeek() {
    const res = await fetch("/api/meal-plan/clear", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    if (res.ok) {
      setMeals([]);
    }
  }

  return { days, meals, loading, assignDish, assignCustomMeal, removeMeal, clearWeek, refetch: fetchMeals };
}
