import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const RecipeSchema = z.object({
  name: z.string().describe("Recipe name"),
  tags: z
    .array(z.string())
    .describe(
      "Relevant tags, e.g. quick, vegetarian, kid-friendly, comfort-food, healthy, pasta, soup, grilling, seafood"
    ),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      unit: z.string(),
      category: z
        .string()
        .describe(
          "One of: Produce, Meat & Seafood, Dairy & Eggs, Bakery, Frozen, Pantry, Canned Goods, Condiments, Snacks, Beverages, Other"
        ),
    })
  ),
  instructions: z.string().describe("Plain text cooking instructions"),
  prep_time: z.number().nullable().describe("Prep time in minutes"),
  cook_time: z.number().nullable().describe("Cook time in minutes"),
  servings: z.number().describe("Number of servings, default 4"),
});

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI import not configured — add ANTHROPIC_API_KEY to your environment" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    let html: string;
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; recipe-importer/1.0)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: `Could not fetch page (HTTP ${response.status})` },
          { status: 422 }
        );
      }
      html = await response.text();
    } catch {
      return NextResponse.json(
        { error: "Could not fetch that URL — the site may block automated requests" },
        { status: 422 }
      );
    }

    // Strip script/style tags and trim to 60KB to stay within token limits
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 60_000);

    const anthropic = createAnthropic({ apiKey });

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: RecipeSchema,
      prompt: `Extract the recipe from this webpage text. Return structured data suitable for a family recipe app.

URL: ${url}

Page text:
${cleaned}

Extract all ingredients with quantities, units, and grocery store category. If prep_time or cook_time aren't mentioned, use null. Default servings to 4 if not specified.`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("AI import-url error:", err);
    return NextResponse.json(
      { error: "Failed to extract recipe from that page" },
      { status: 500 }
    );
  }
}
