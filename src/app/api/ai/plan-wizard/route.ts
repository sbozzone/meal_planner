import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const WizardSchema = z.object({
  favoriteSuggestions: z
    .array(
      z.object({
        name: z.string().describe("Exact dish name from the family library"),
        reason: z.string().describe("One sentence: why this works given what's in the pantry or recent history"),
        matchingPantryItem: z.string().nullable().describe("The pantry item this dish uses, or null"),
      })
    )
    .min(1)
    .max(4)
    .describe("Dishes already in the family's library that make sense given pantry stock and recency"),
  newIdeas: z
    .array(
      z.object({
        name: z.string().describe("A new meal name not in the library"),
        protein: z.string().describe("The primary protein or main ingredient from the pantry"),
        reason: z.string().describe("One sentence on why this would be good"),
      })
    )
    .min(1)
    .max(4)
    .describe("Fresh meal ideas based on proteins and ingredients currently in the pantry"),
});

export type WizardResult = {
  proteins: Array<{ name: string; quantity: number; unit: string }>;
  favoriteSuggestions: z.infer<typeof WizardSchema>["favoriteSuggestions"];
  newIdeas: z.infer<typeof WizardSchema>["newIdeas"];
};

// Keywords that identify protein-rich pantry items worth surfacing
const PROTEIN_KEYWORDS = [
  "chicken", "beef", "pork", "lamb", "turkey", "salmon", "tuna", "shrimp",
  "cod", "tilapia", "fish", "steak", "ground", "sausage", "bacon", "ham",
  "tofu", "tempeh", "lentils", "beans", "eggs",
];

function isProtein(name: string, category: string | null): boolean {
  const lower = name.toLowerCase();
  if (category?.toLowerCase().includes("meat")) return true;
  return PROTEIN_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured — add ANTHROPIC_API_KEY" },
      { status: 503 }
    );
  }

  const supabase = createServerClient();

  const [{ data: pantryItems }, { data: dishes }, { data: recentPlans }] =
    await Promise.all([
      supabase
        .from("pantry_items")
        .select("name, quantity, unit, category")
        .eq("family_id", familyId)
        .order("name"),
      supabase
        .from("dishes")
        .select("name, tags")
        .eq("family_id", familyId)
        .order("name"),
      supabase
        .from("meal_plans")
        .select("meal_date, custom_name, dish:dishes(name)")
        .eq("family_id", familyId)
        .gte(
          "meal_date",
          new Date(Date.now() - 28 * 86400_000).toISOString().split("T")[0]
        )
        .order("meal_date", { ascending: false }),
    ]);

  const proteins = (pantryItems ?? []).filter((item) =>
    isProtein(item.name, item.category)
  );

  const pantryList =
    pantryItems && pantryItems.length > 0
      ? pantryItems.map((i) => `- ${i.name}: ${i.quantity} ${i.unit}`).join("\n")
      : "(pantry is empty)";

  const libraryList =
    dishes && dishes.length > 0
      ? dishes
          .map((d) => `- ${d.name}${d.tags?.length ? ` [${(d.tags as string[]).join(", ")}]` : ""}`)
          .join("\n")
      : "(no dishes in library)";

  const recentList =
    recentPlans && recentPlans.length > 0
      ? recentPlans
          .map((p) => {
            const dishName = Array.isArray(p.dish)
              ? (p.dish[0] as { name: string } | undefined)?.name
              : (p.dish as { name: string } | null)?.name;
            return `- ${dishName ?? p.custom_name ?? "Unknown"} (${p.meal_date})`;
          })
          .join("\n")
      : "(none)";

  const anthropic = createAnthropic({ apiKey });

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: WizardSchema,
    prompt: `You are a family meal planning assistant. Help plan this week's dinners.

PANTRY (what's on hand):
${pantryList}

FAMILY'S DISH LIBRARY:
${libraryList}

SERVED IN THE LAST 4 WEEKS (avoid repeating soon):
${recentList}

Your job:
1. favoriteSuggestions: Pick up to 4 dishes from the library that (a) use ingredients already in the pantry OR (b) haven't been served in a while and would be welcome now. Use the EXACT name from the library.
2. newIdeas: Suggest up to 4 NEW dinner ideas (not in the library) that make smart use of the proteins and ingredients in the pantry. Be specific with the dish name (e.g. "Lemon-herb baked salmon" not just "Salmon dish").

Keep reasons short and practical. Avoid repeating anything from the last 4 weeks.`,
  });

  const result: WizardResult = {
    proteins: proteins.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit ?? "count",
    })),
    favoriteSuggestions: object.favoriteSuggestions,
    newIdeas: object.newIdeas,
  };

  return NextResponse.json(result);
}
