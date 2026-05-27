"use client";

import { useCallback, useEffect, useState } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import type { DinnerActivity } from "@/types/database";

export type DinnerActivityInput = {
  activity_date: string;
  title: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
};

export function useDinnerActivities(weekStart: string) {
  const { family } = useFamily();
  const [activities, setActivities] = useState<DinnerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { "x-family-id": family.id };

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/activities?weekStart=${weekStart}`, {
      headers,
    });
    if (res.ok) {
      setActivities(await res.json());
    }
    setLoading(false);
  }, [family.id, weekStart]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dinner-activities-${family.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dinner_activities",
          filter: `family_id=eq.${family.id}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [family.id, fetchActivities]);

  async function addActivity(input: DinnerActivityInput) {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const activity = await res.json();
      setActivities((prev) => [...prev, activity]);
      return activity as DinnerActivity;
    }
    return null;
  }

  async function updateActivity(id: string, input: DinnerActivityInput) {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const activity = await res.json();
      setActivities((prev) =>
        prev.map((entry) => (entry.id === id ? activity : entry))
      );
      return activity as DinnerActivity;
    }
    return null;
  }

  async function deleteActivity(id: string) {
    const res = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setActivities((prev) => prev.filter((entry) => entry.id !== id));
    }
  }

  return {
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
  };
}
