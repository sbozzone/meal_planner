import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) return NextResponse.json({ error: "Missing family ID" }, { status: 400 });

  const { members } = await request.json();
  if (!Array.isArray(members)) {
    return NextResponse.json({ error: "members must be an array" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("families")
    .update({ members })
    .eq("id", familyId)
    .select("members")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
