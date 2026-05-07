import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateVisualization } from "@/trigger/generateVisualization";

export const runtime = "nodejs";

const STORAGE_BUCKET = "plumely-uploads";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type LightMeta = {
  name?: string;
  brand?: string;
  sku?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const room = form.get("room");
  const light = form.get("light");
  const metaRaw = form.get("meta");

  if (!(room instanceof File) || !(light instanceof File)) {
    return NextResponse.json(
      { error: "Both 'room' and 'light' files are required." },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME.has(room.type) || !ALLOWED_MIME.has(light.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WEBP images are allowed." },
      { status: 415 },
    );
  }
  if (room.size > MAX_BYTES || light.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Each image must be 10 MB or smaller." },
      { status: 413 },
    );
  }

  const meta: LightMeta = (() => {
    try {
      return typeof metaRaw === "string" ? (JSON.parse(metaRaw) as LightMeta) : {};
    } catch {
      return {};
    }
  })();

  // 1. Reserve a generation row so we can use its id in storage paths.
  const { data: gen, error: genErr } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      room_image_path: "pending",
      light_image_path: "pending",
      status: "pending",
    })
    .select("id")
    .single();

  if (genErr || !gen) {
    return NextResponse.json(
      { error: genErr?.message ?? "Failed to create generation." },
      { status: 500 },
    );
  }

  const generationId = gen.id as string;
  const roomPath = `${user.id}/${generationId}/room.${extFor(room.type)}`;
  const lightPath = `${user.id}/${generationId}/light.${extFor(light.type)}`;

  // 2. Upload both images to private storage.
  const uploads = await Promise.all([
    supabase.storage.from(STORAGE_BUCKET).upload(roomPath, room, {
      contentType: room.type,
      upsert: false,
    }),
    supabase.storage.from(STORAGE_BUCKET).upload(lightPath, light, {
      contentType: light.type,
      upsert: false,
    }),
  ]);
  const uploadErr = uploads.find((u) => u.error)?.error;
  if (uploadErr) {
    await supabase
      .from("generations")
      .update({ status: "failed", error: uploadErr.message })
      .eq("id", generationId);
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // 3. Save light metadata if the user named it.
  let lightId: string | null = null;
  if (meta.name?.trim()) {
    const { data: lightRow } = await supabase
      .from("lights")
      .insert({
        user_id: user.id,
        name: meta.name.trim(),
        brand: meta.brand?.trim() || null,
        sku: meta.sku?.trim() || null,
        image_path: lightPath,
      })
      .select("id")
      .single();
    lightId = lightRow?.id ?? null;
  }

  // 4. Update the generation row with paths + light_id.
  await supabase
    .from("generations")
    .update({
      room_image_path: roomPath,
      light_image_path: lightPath,
      light_id: lightId,
    })
    .eq("id", generationId);

  // 5. Enqueue the Trigger.dev task.
  try {
    const handle = await generateVisualization.trigger({
      generationId,
      userId: user.id,
      roomPath,
      lightPath,
    });
    await supabase
      .from("generations")
      .update({ trigger_run_id: handle.id })
      .eq("id", generationId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue task.";
    await supabase
      .from("generations")
      .update({ status: "failed", error: message })
      .eq("id", generationId);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ id: generationId });
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
