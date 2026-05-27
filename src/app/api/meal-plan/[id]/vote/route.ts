import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type VoteValue = 1 | -1;
type Votes = Record<string, VoteValue>;

function countVotes(votes: Votes) {
  return Object.values(votes).reduce((sum, vote) => sum + vote, 0);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const familyId = request.headers.get("x-family-id");
  if (!familyId) {
    return NextResponse.json({ error: "Missing family ID" }, { status: 400 });
  }

  try {
    const { voteValue, deviceId } = await request.json();
    if ((voteValue !== 1 && voteValue !== -1) || typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: meal, error: readError } = await supabase
      .from("meal_plans")
      .select("id, votes")
      .eq("id", id)
      .eq("family_id", familyId)
      .single();

    if (readError || !meal) {
      return NextResponse.json({ error: readError?.message || "Meal not found" }, { status: 404 });
    }

    const votes: Votes = { ...((meal.votes as Votes | null) || {}) };
    votes[deviceId] = voteValue;
    const voteCount = countVotes(votes);

    const { data, error } = await supabase
      .from("meal_plans")
      .update({ votes, vote_count: voteCount })
      .eq("id", id)
      .eq("family_id", familyId)
      .select("id, votes, vote_count")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      voteCount: data.vote_count,
      userVote: voteValue,
      votes: data.votes,
    });
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

  const deviceId = request.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: meal, error: readError } = await supabase
    .from("meal_plans")
    .select("id, votes")
    .eq("id", id)
    .eq("family_id", familyId)
    .single();

  if (readError || !meal) {
    return NextResponse.json({ error: readError?.message || "Meal not found" }, { status: 404 });
  }

  const votes: Votes = { ...((meal.votes as Votes | null) || {}) };
  delete votes[deviceId];
  const voteCount = countVotes(votes);

  const { data, error } = await supabase
    .from("meal_plans")
    .update({ votes, vote_count: voteCount })
    .eq("id", id)
    .eq("family_id", familyId)
    .select("id, votes, vote_count")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    voteCount: data.vote_count,
    userVote: null,
    votes: data.votes,
  });
}
