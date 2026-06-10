import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type PantryRow = Record<string, unknown> & {
  quantity: number | string;
  low_stock_threshold: number | string | null;
  expiry_date: string | null;
};

function decorateItem(item: PantryRow) {
  const daysUntilExpiry = item.expiry_date
    ? Math.ceil((new Date(`${item.expiry_date}T00:00:00`).getTime() - Date.now()) / 86400000)
    : null;

  return {
    ...item,
    quantity: Number(item.quantity),
    low_stock_threshold:
      item.low_stock_threshold === null ? null : Number(item.low_stock_threshold),
    daysUntilExpiry,
    lowStock:
      item.low_stock_threshold !== null &&
      Number(item.quantity) <= Number(item.low_stock_threshold),
  };
}

export async function GET(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("family_id", familyId)
    .order("category")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data || []).map(decorateItem));
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const quantity = Number(body.quantity);

    if (!name || Number.isNaN(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Name and quantity are required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        family_id: familyId,
        name,
        quantity,
        unit: body.unit || "count",
        category: body.category || "Other",
        expiry_date: body.expiryDate || null,
        low_stock_threshold:
          body.lowStockThreshold === "" || body.lowStockThreshold === undefined
            ? null
            : Number(body.lowStockThreshold),
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(decorateItem(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
