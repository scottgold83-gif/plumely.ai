import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateVisualization } from "@/trigger/generateVisualization";
import { generateHourly, generateDaily, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const STORAGE_BUCKET = "plumely-uploads";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type LightType =
  | "ceiling"
  | "wall"
  | "hanging"
  | "chandelier"
  | "outdoor";

const ALLOWED_LIGHT_TYPES: ReadonlySet<LightType> = new Set([
  "ceiling",
  "wall",
  "hanging",
  "chandelier",
  "outdoor",
]);

type LightMeta = {
  name?: string;
  brand?: string;
  sku?: string;
  type?: string;
};

// Verify that a file's actual bytes match a known image format (PNG, JPEG, WebP).
// Defends against renamed/spoofed uploads that only claim to be images via MIME type.
async function verifyImageMagicBytes(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  // JPEG: FF D8 FF
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  // WebP: bytes 0-3 "RIFF", bytes 8-11 "WEBP"
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  return isPng || isJpeg || isWebp;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // --- Rate limiting: block abuse before any expensive work ---
  const ip = clientIp(request);
  const limitKeys = [`u:${user.id}`, `ip:${ip}`];
  for (const key of limitKeys) {
    const hour = await generateHourly.limit(key);
    if (!hour.success) {
      return NextResponse.json(
        {
          error:
            "Your image generation limit has been reached. Please try again in a little while.",
        },
        { status: 429 },
      );
    }
    const day = await generateDaily.limit(key);
    if (!day.success) {
      return NextResponse.json(
        {
          error:
            "Your image generation limit has been reached for today. Please come back tomorrow.",
        },
        { status: 429 },
      );
    }
  }

  const form = await request.formData();
  const room = form.get("room");
  const light = form.get("light");
  const metaRaw = form.get("meta");
  const userPromptRaw = form.get("userPrompt");
  const userPrompt =
    typeof userPromptRaw === "string"
      ? userPromptRaw.trim().slice(0, 400)
      : undefined;
// --- Verify the Cloudflare Turnstile token (real bot check) ---
  const turnstileToken = form.get("turnstileToken");
  if (typeof turnstileToken !== "string" || !turnstileToken) {
    return NextResponse.json(
      { error: "Bot check failed. Please refresh and try again." },
      { status: 403 },
    );
  }
  const turnstileVerify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY ?? "",
        response: turnstileToken,
      }),
    },
  );
  const turnstileResult = (await turnstileVerify.json()) as { success: boolean };
  if (!turnstileResult.success) {
    return NextResponse.json(
      { error: "Bot check failed. Please refresh and try again." },
      { status: 403 },
    );
  }
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
  // Verify uploads are actually images by reading magic bytes (defense against MIME spoofing)
  const [roomMagicOk, lightMagicOk] = await Promise.all([
    verifyImageMagicBytes(room),
    verifyImageMagicBytes(light),
  ]);
  if (!roomMagicOk || !lightMagicOk) {
    return NextResponse.json(
      { error: "Uploaded files must be valid JPEG, PNG, or WebP images." },
      { status: 415 },
    );
  }

  const meta: LightMeta = (() => {
    try {
      return typeof metaRaw === "string" ? (JSON.parse(metaRaw) as LightMeta) : {};
    } catch {
      return {};
    }
  })();

  // Placement category is required so Gemini knows exactly where to mount the fixture.
  if (!meta.type || !ALLOWED_LIGHT_TYPES.has(meta.type as LightType)) {
    return NextResponse.json(
      {
        error:
          "Choose where the light goes (ceiling, wall, pendant, chandelier, or outdoor) before generating.",
      },
      { status: 400 },
    );
  }
  const lightType = meta.type as LightType;

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
    console.error("Upload failed:", uploadErr.message);
    return NextResponse.json(
      { error: "We couldn't upload your photos. Please try again." },
      { status: 500 },
    );
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
      lightType,
      userPrompt,
    });
    await supabase
      .from("generations")
      .update({ trigger_run_id: handle.id })
      .eq("id", generationId);
  } catch (err) {
    const message = err instanceof Error ? "We couldn't queue your generation. Please try again." : "Failed to queue task.";
    console.error("Trigger.dev queue failed:", err);
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
