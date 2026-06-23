import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Ingredient } from "@/types/database";

type IngredientTotal = {
  amount: number | null;
  unit: string;
  quantityParts: string[];
  category: string;
  mealPlanId: string;
};

function normalizeUnit(unit: string | null | undefined) {
  const normalized = (unit || "count").trim().toLowerCase();
  const aliases: Record<string, string> = {
    cups: "cup",
    tablespoons: "tbsp",
    tablespoon: "tbsp",
    teaspoons: "tsp",
    teaspoon: "tsp",
    ounces: "oz",
    ounce: "oz",
    pounds: "lb",
    pound: "lb",
  };
  return aliases[normalized] || normalized;
}

function parseQuantity(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  const mixed = normalized.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = normalized.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatQuantity(amount: number | null, unit: string, fallback: string[]) {
  if (amount === null) return fallback.join(", ");
  const rendered = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  return `${rendered}${unit ? ` ${unit}` : ""}`;
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const { weekStart } = await request.json();
    const supabase = createServerClient();

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const { data: mealPlans } = await supabase
      .from("meal_plans")
      .select("id, dish:dishes(name, ingredients)")
      .eq("family_id", familyId)
      .gte("meal_date", weekStart)
      .lte("meal_date", weekEndStr);

    if (!mealPlans || mealPlans.length === 0) {
      return NextResponse.json(
        { error: "No meals planned this week" },
        { status: 400 }
      );
    }

    // Collect all ingredients from planned dishes
    const ingredientMap = new Map<string, IngredientTotal>();

    for (const mp of mealPlans) {
      const dish = mp.dish as unknown as { name: string; ingredients: Ingredient[] } | null;
      if (!dish?.ingredients) continue;

      for (const ing of dish.ingredients) {
        if (!ing.name.trim()) continue;
        const name = ing.name.trim();
        const unit = normalizeUnit(ing.unit);
        const key = `${name.toLowerCase()}|${unit}`;
        const existing = ingredientMap.get(key);
        const amount = parseQuantity(ing.quantity);

        if (existing) {
          // Only total quantities with compatible, parsable units. Keeping the
          // original entries visible is safer than inventing a conversion.
          if (amount !== null && existing.amount !== null) {
            existing.amount += amount;
          } else {
            existing.amount = null;
          }
          if (ing.quantity.trim()) existing.quantityParts.push(ing.quantity.trim());
        } else {
          ingredientMap.set(key, {
            amount,
            unit,
            quantityParts: ing.quantity.trim() ? [ing.quantity.trim()] : [],
            category: ing.category || "Other",
            mealPlanId: mp.id,
          });
        }
      }
    }

    if (ingredientMap.size === 0) {
      return NextResponse.json(
        { error: "No ingredients found on planned dishes. Add ingredients to your dishes first." },
        { status: 400 }
      );
    }

    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("id, name, quantity, unit, low_stock_threshold")
      .eq("family_id", familyId);

    const findPantryMatch = (ingredientName: string) =>
      (pantryItems || []).find(
        (item) => String(item.name).trim().toLowerCase() === ingredientName.toLowerCase()
      );

    // Remove existing auto-generated items for this family
    await supabase
      .from("shopping_items")
      .delete()
      .eq("family_id", familyId)
      .eq("source", "auto");

    // Insert new auto items
    const items = Array.from(ingredientMap.entries()).map(([key, data]) => {
      const [name] = key.split("|");
      const pantry = findPantryMatch(name);
      const lowStock =
        pantry?.low_stock_threshold !== null &&
        pantry?.low_stock_threshold !== undefined &&
        Number(pantry.quantity) <= Number(pantry.low_stock_threshold);
      const comparableUnit = pantry
        ? normalizeUnit(pantry.unit) === data.unit
        : false;
      const hasEnough =
        Boolean(pantry) &&
        comparableUnit &&
        data.amount !== null &&
        Number(pantry?.quantity) >= data.amount;
      const requiredQuantity = formatQuantity(data.amount, data.unit, data.quantityParts);
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const pantryNote = pantry
        ? hasEnough
          ? lowStock
            ? `Pantry has ${pantry.quantity} ${pantry.unit || ""}, but it is low stock`
            : `Pantry has enough: ${pantry.quantity} ${pantry.unit || ""}`
          : comparableUnit
          ? `Pantry has ${pantry.quantity} ${pantry.unit || ""}; need ${requiredQuantity}`
          : `Pantry has ${pantry.quantity} ${pantry.unit || ""}; verify the amount needed`
        : null;

      return {
        family_id: familyId,
        name: displayName,
        quantity: requiredQuantity || null,
        category: data.category,
        source: "auto",
        meal_plan_id: data.mealPlanId,
        pantry_item_id: pantry?.id || null,
        pantry_note: pantryNote,
        is_checked: hasEnough && !lowStock,
      };
    });

    const { data, error } = await supabase
      .from("shopping_items")
      .insert(items)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ generated: data?.length || 0, items: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
