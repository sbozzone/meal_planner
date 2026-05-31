import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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

export async function GET(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("pantry_items")
    .select("name, quantity, unit, category")
    .eq("family_id", familyId)
    .order("name");

  const proteins = (data ?? [])
    .filter((item) => isProtein(item.name, item.category))
    .map((p) => ({ name: p.name, quantity: Number(p.quantity), unit: p.unit ?? "count" }));

  return NextResponse.json(proteins);
}
