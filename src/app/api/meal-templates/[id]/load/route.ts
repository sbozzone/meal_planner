import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MealTemplateMeal } from "@/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const { startDate, overwrite = true } = await request.json();
    if (!startDate) {
      return NextResponse.json({ error: "Missing startDate" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: template, error: readError } = await supabase
      .from("meal_templates")
      .select("meals")
      .eq("id", id)
      .eq("family_id", familyId)
      .single();

    if (readError || !template) {
      return NextResponse.json({ error: readError?.message || "Template not found" }, { status: 404 });
    }

    const start = new Date(`${startDate}T00:00:00`);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (overwrite) {
      await supabase
        .from("meal_plans")
        .delete()
        .eq("family_id", familyId)
        .gte("meal_date", startDate)
        .lte("meal_date", weekEnd.toISOString().split("T")[0]);
    }

    const rows = ((template.meals || []) as MealTemplateMeal[])
      .filter((meal) => meal.dishId || meal.customName)
      .map((meal, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + meal.dayOfWeek);
        return {
          family_id: familyId,
          dish_id: meal.dishId || null,
          custom_name: meal.dishId ? null : meal.customName || meal.dishName || null,
          meal_date: date.toISOString().split("T")[0],
          position: index,
        };
      });

    if (rows.length === 0) {
      return NextResponse.json({ loaded: 0, items: [] });
    }

    const { data, error } = await supabase
      .from("meal_plans")
      .insert(rows)
      .select("*, dish:dishes(*)");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ loaded: data?.length || 0, items: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
