import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  const weekStart = request.nextUrl.searchParams.get("weekStart");

  if (!familyId || !weekStart) {
    return NextResponse.json(
      { error: "Missing family ID or weekStart" },
      { status: 400 }
    );
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("dinner_activities")
    .select("*")
    .eq("family_id", familyId)
    .gte("activity_date", weekStart)
    .lte("activity_date", weekEndStr)
    .order("activity_date")
    .order("start_time", { nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title || !body.activity_date) {
      return NextResponse.json(
        { error: "Activity date and title are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("dinner_activities")
      .insert({
        family_id: familyId,
        activity_date: body.activity_date,
        title,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        notes: body.notes?.trim() || null,
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
