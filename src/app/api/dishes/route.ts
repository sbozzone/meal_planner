import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("family_id", familyId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dishesWithSignedMemoryUrls = await Promise.all(
    (data || []).map(async (dish) => {
      if (!dish.memory_image_path) return dish;
      const { data: signed } = await supabase.storage
        .from("family-memories")
        .createSignedUrl(dish.memory_image_path, 60 * 60);
      return { ...dish, memory_image_url: signed?.signedUrl || null };
    })
  );

  return NextResponse.json(dishesWithSignedMemoryUrls);
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("dishes")
      .insert({
        family_id: familyId,
        name: body.name,
        tags: body.tags || [],
        ingredients: body.ingredients || [],
        source_url: body.source_url || null,
        notes: body.notes || null,
        instructions:
          typeof body.instructions === "string" && body.instructions.trim()
            ? body.instructions.trim()
            : null,
        prep_time:
          Number.isFinite(Number(body.prep_time)) && Number(body.prep_time) >= 0
            ? Number(body.prep_time)
            : null,
        cook_time:
          Number.isFinite(Number(body.cook_time)) && Number(body.cook_time) >= 0
            ? Number(body.cook_time)
            : null,
        servings:
          Number.isFinite(Number(body.servings)) && Number(body.servings) > 0
            ? Number(body.servings)
            : 4,
        is_memory: Boolean(body.is_memory),
        memory_story: body.memory_story || null,
        memory_image_url: body.memory_image_url || null,
        appliances: Array.isArray(body.appliances) ? body.appliances : [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
