import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  const weekStart = request.nextUrl.searchParams.get("weekStart");

  if (!familyId || !weekStart) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("chef_assignments")
    .select("*")
    .eq("family_id", familyId)
    .gte("chef_date", weekStart)
    .lte("chef_date", weekEndStr)
    .order("chef_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) return NextResponse.json({ error: "Missing family ID" }, { status: 400 });

  const { chef_date, chef_name } = await request.json();
  if (!chef_date || !chef_name?.trim()) {
    return NextResponse.json({ error: "Missing chef_date or chef_name" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("chef_assignments")
    .upsert(
      { family_id: familyId, chef_date, chef_name: chef_name.trim() },
      { onConflict: "family_id,chef_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
