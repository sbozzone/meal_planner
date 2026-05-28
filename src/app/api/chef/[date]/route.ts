import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const familyId = request.headers.get("x-family-id");
  if (!familyId) return NextResponse.json({ error: "Missing family ID" }, { status: 400 });

  const { date } = await params;
  const supabase = createServerClient();
  const { error } = await supabase
    .from("chef_assignments")
    .delete()
    .eq("family_id", familyId)
    .eq("chef_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
