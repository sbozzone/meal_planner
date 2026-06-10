"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useFamily } from "@/lib/family-context";
import { createClient } from "@/lib/supabase/client";
import type { MealTemplate, MealTemplateMeal } from "@/types/database";

export function useMealTemplates() {
  const { family } = useFamily();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = useMemo(() => ({ "x-family-id": family.id }), [family.id]);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/meal-templates", { headers });
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, [headers]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`meal-templates-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_templates", filter: `family_id=eq.${family.id}` },
        () => { fetchTemplates(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family.id, fetchTemplates]);

  async function saveTemplate(name: string, description: string, meals: MealTemplateMeal[]) {
    const res = await fetch("/api/meal-templates", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, meals }),
    });
    if (res.ok) {
      const template = await res.json();
      setTemplates((prev) => [template, ...prev]);
      return template;
    }
    return null;
  }

  async function loadTemplate(id: string, startDate: string) {
    const res = await fetch(`/api/meal-templates/${id}/load`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, overwrite: true }),
    });
    return res.ok;
  }

  async function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
    await fetch(`/api/meal-templates/${id}`, { method: "DELETE", headers });
  }

  return {
    templates,
    loading,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
