import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const SuggestDishesSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().describe("Dish name"),
        tags: z
          .array(z.string())
          .describe("Relevant tags from: quick, vegetarian, vegan, kid-friendly, date-night, comfort-food, healthy, leftovers-friendly, one-pot, grilling, seafood, pasta, soup, slow-cooker, instant-pot"),
        reason: z
          .string()
          .describe("One sentence: why this fits their taste based on their existing dishes"),
      })
    )
    .length(5),
});

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI suggestions not configured — add ANTHROPIC_API_KEY to your environment" },
      { status: 503 }
    );
  }

  try {
    const supabase = createServerClient();

    const { data: dishes } = await supabase
      .from("dishes")
      .select("name, tags")
      .eq("family_id", familyId)
      .order("name");

    const libraryList =
      dishes && dishes.length > 0
        ? dishes
            .map(
              (d) =>
                `- ${d.name}${d.tags?.length ? ` [${(d.tags as string[]).join(", ")}]` : ""}`
            )
            .join("\n")
        : "(no dishes added yet)";

    const anthropic = createAnthropic({ apiKey });

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: SuggestDishesSchema,
      prompt: `You are a family meal planning assistant. Based on a family's existing dish library, suggest 5 new dishes they might enjoy adding to their collection.

Family's current dish library:
${libraryList}

Rules:
- Suggest dishes NOT already in the library
- Match the family's apparent taste profile (cuisine types, dietary preferences, complexity)
- Vary the suggestions across different meals/styles
- If library is empty, suggest a well-rounded mix of family-friendly classics
- Keep reasons short and specific (e.g. "Similar to your pasta dishes but with a new twist" or "A quick veggie option to balance your menu")
- Assign relevant tags from the allowed list`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("AI suggest-dishes error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
