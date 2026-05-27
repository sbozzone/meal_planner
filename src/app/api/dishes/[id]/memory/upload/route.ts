import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const supabase = createServerClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${familyId}/${id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("family-memories")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from("family-memories")
      .getPublicUrl(path);

    const memoryImageUrl = publicUrl.publicUrl;
    const { error: updateError } = await supabase
      .from("dishes")
      .update({ memory_image_url: memoryImageUrl })
      .eq("id", id)
      .eq("family_id", familyId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ memoryImageUrl, path });
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
}
