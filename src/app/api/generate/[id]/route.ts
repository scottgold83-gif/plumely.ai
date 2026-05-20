import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STORAGE_BUCKET = "plumely-uploads";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: gen, error } = await supabase
    .from("generations")
    .select("status, result_image_path, error")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !gen) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let resultUrl: string | null = null;
  if (gen.status === "succeeded" && gen.result_image_path) {
    const admin = createSupabaseAdminClient();
    const { data: signed } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(gen.result_image_path, SIGNED_URL_TTL_SECONDS);
    resultUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    status: gen.status,
    error: gen.error ? "Generation failed. Please try again." : null,
    resultUrl,
  });
}