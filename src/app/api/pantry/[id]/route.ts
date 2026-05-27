import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function cleanPatch(body: Record<string, any>) {
  const patch: Record<string, any> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.quantity !== undefined) patch.quantity = Number(body.quantity);
  if (body.unit !== undefined) patch.unit = body.unit || "count";
  if (body.category !== undefined) patch.category = body.category || "Other";
  if (body.expiryDate !== undefined) patch.expiry_date = body.expiryDate || null;
  if (body.lowStockThreshold !== undefined) {
    patch.low_stock_threshold =
      body.lowStockThreshold === "" || body.lowStockThreshold === null
        ? null
        : Number(body.lowStockThreshold);
  }
  if (body.notes !== undefined) patch.notes = body.notes || null;
  return patch;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = createServerClient();
    const patch = cleanPatch(body);

    if (body.consumed !== undefined) {
      const { data: existing, error: readError } = await supabase
        .from("pantry_items")
        .select("quantity")
        .eq("id", id)
        .eq("family_id", familyId)
        .single();

      if (readError || !existing) {
        return NextResponse.json({ error: readError?.message || "Item not found" }, { status: 404 });
      }

      patch.quantity = Math.max(0, Number(existing.quantity) - Number(body.consumed || 1));
    }

    const { data, error } = await supabase
      .from("pantry_items")
      .update(patch)
      .eq("id", id)
      .eq("family_id", familyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("family_id", familyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
