import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const SuggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().describe("Dish name — use exact name if from library"),
        fromLibrary: z
          .boolean()
          .describe("True if this dish name appears in the family's library"),
        reason: z
          .string()
          .describe("One sentence: why this is a good pick for tonight"),
      })
    )
    .length(3),
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
    const body = await request.json();
    const { date } = body; // "2026-05-19"

    const supabase = createServerClient();

    // Fetch the family's dish library
    const { data: dishes } = await supabase
      .from("dishes")
      .select("name, tags")
      .eq("family_id", familyId)
      .order("name");

    // Fetch last 3 weeks of meal plans to avoid repetition
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const { data: recentPlans } = await supabase
      .from("meal_plans")
      .select("meal_date, custom_name, dish:dishes(name)")
      .eq("family_id", familyId)
      .gte("meal_date", threeWeeksAgo.toISOString().split("T")[0])
      .order("meal_date", { ascending: false });

    // Build context strings
    const libraryList =
      dishes && dishes.length > 0
        ? dishes
            .map(
              (d) =>
                `- ${d.name}${d.tags?.length ? ` [${(d.tags as string[]).join(", ")}]` : ""}`
            )
            .join("\n")
        : "(no dishes added yet)";

    const recentList =
      recentPlans && recentPlans.length > 0
        ? recentPlans
            .map((p) => {
              const dishName = Array.isArray(p.dish)
                ? (p.dish[0] as { name: string } | undefined)?.name
                : (p.dish as { name: string } | null)?.name;
              const name = dishName ?? p.custom_name ?? "Unknown";
              return `- ${name} (${p.meal_date})`;
            })
            .join("\n")
        : "(none)";

    const dayOfWeek = date
      ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : "tonight";

    const anthropic = createAnthropic({ apiKey });

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: SuggestionSchema,
      prompt: `You are a helpful family meal planning assistant.

Suggest 3 dinner ideas for: ${dayOfWeek}

Family's dish library:
${libraryList}

Recently served (avoid repeating these soon):
${recentList}

Rules:
- Prefer dishes from the library when they fit the day
- Include at least one new idea not in the library
- Vary the suggestions (don't suggest similar dishes)
- Keep reasons short and practical (e.g. "Quick to make on a weeknight" or "Haven't had this in a while")
- If fromLibrary is true, use the EXACT dish name from the library list above`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
