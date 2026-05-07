import { logger, task } from "@trigger.dev/sdk/v3";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "plumely-uploads";
const MODEL = "gemini-2.5-flash-image";

const MASTER_PROMPT = `You are a photorealistic interior visualization engine. You will receive TWO images:

IMAGE 1: A lighting product (the "FIXTURE") — this could be a pendant, chandelier, floor lamp, table lamp, wall sconce, LED strip, neon sign, recessed light, or any other lighting product.

IMAGE 2: A room photograph (the "ROOM") — the customer's actual space.

YOUR TASK: Generate ONE photorealistic image showing the FIXTURE installed in the ROOM, turned ON, as if professionally photographed in that exact space.

═══════════════════════════════════
STEP 1 — ANALYZE THE FIXTURE
═══════════════════════════════════
Identify the fixture category and determine its correct mounting:
- Pendant / chandelier / flush mount → mount to CEILING
- Wall sconce / picture light → mount to WALL
- Table lamp / desk lamp → place on nearest TABLE, desk, or nightstand
- Floor lamp / torchiere → place on FLOOR beside furniture
- LED strip / rope light → install along edges (under cabinets, behind TV, around ceiling cove, under bed frame, along stairs) — choose the most natural location visible in the room
- Neon sign / wall art light → mount on largest empty WALL
- Recessed / downlight → embed in CEILING
- Track / spot lighting → mount to CEILING rail

Preserve the fixture's EXACT shape, color, materials, finish, proportions, and design details. Do not stylize, simplify, or reinterpret it.

═══════════════════════════════════
STEP 2 — ANALYZE THE ROOM
═══════════════════════════════════
- Identify ceiling height, wall positions, existing furniture, and natural focal points
- Note the room's existing light sources, color temperature, and time of day
- Identify the camera angle and perspective
- Find the most natural, aesthetically correct placement for the fixture

═══════════════════════════════════
STEP 3 — COMPOSITE THE FIXTURE
═══════════════════════════════════
- Place the fixture at realistic real-world scale (a pendant is ~30-50cm wide, a floor lamp is ~150cm tall, etc.)
- Match the room's perspective, camera angle, and lens distortion exactly
- Anchor it physically — ceiling fixtures need a visible cord/canopy, wall fixtures need a mounting plate, floor lamps sit flat on the floor
- For LED strips: follow the contour of the surface precisely, with even spacing and realistic adhesive mounting

═══════════════════════════════════
STEP 4 — RENDER THE LIGHTING (PHYSICAL LIGHT PROPAGATION)
═══════════════════════════════════

The fixture is TURNED ON and is now actively emitting light into the 3D space of the room. You must simulate physically accurate light propagation, as if rendering this scene in a path-traced 3D engine. The viewer must clearly see light TRAVELING from the fixture across the entire room.

═══ A) LIGHT EMISSION FROM THE FIXTURE ═══
- The bulb / LED / emissive surface glows brightly with strong bloom and a visible halo
- Add subtle volumetric light rays / god rays radiating outward from the source if the fixture is bright enough
- The fixture's emissive area is the HOTTEST, BRIGHTEST point in the entire image — it should clip toward white at its core

═══ B) LIGHT THROW (where the light lands) ═══
This is the most important part. The light must visibly LAND on multiple surfaces:
- CEILING: For ceiling fixtures, paint a large bright halo on the ceiling extending 1.5–3 meters outward, fading gradually
- NEAREST WALL: A soft directional wash on the wall closest to the fixture, brightest at the point closest to the source
- FAR WALL: Even the wall farthest from the fixture should be visibly lifted in brightness — at least 15–25% brighter than the original
- FLOOR / FURNITURE BELOW: A bright pool of light on the floor, bed, table, or whatever sits directly below or in front of the fixture
- ADJACENT SURFACES: Any object within 2 meters of the fixture (bedframe, nightstand, chair, plant, picture frame) must show a visible bright side facing the fixture

═══ C) DIRECTIONAL SHADOWS (MANDATORY FOR EVERY OBJECT) ═══
Every solid object in the room MUST cast a new shadow directed AWAY from the fixture's position:
- Bed / bed frame → shadow on the floor and adjacent wall
- Chairs, desks, dressers → shadow on the floor extending away from the light
- Plants → leafy dappled shadow on the wall behind them
- Picture frames / mirrors → thin shadow on the wall opposite the fixture
- People (if visible) → shadow on the bed, floor, or wall away from the source
- Lampshades and the fixture itself → cast their own shape onto the ceiling/wall

Shadow characteristics:
- Direction: ALWAYS away from the fixture
- Softness: soft-edged for shaded/diffused fixtures, sharper for bare bulbs and exposed LEDs
- Length: longer for objects farther from the fixture, shorter for objects directly under it
- Opacity: visible but not pitch black — modulate by ambient room light

If you cannot identify shadow direction for an object, place the shadow on the side opposite the fixture's position in the frame.

═══ D) GLOBAL BRIGHTNESS LIFT ═══
- Increase overall room exposure by 40–70% compared to the original
- The brightness gradient must be: brightest near the fixture → moderately bright at mid-distance → still noticeably brighter than original at the far corners
- NO part of the room may remain at original exposure unless it is fully blocked from the fixture by a solid object (in which case it sits in shadow)

═══ E) COLOR TEMPERATURE WASH ═══
- Warm bulb (~2700K) → amber/golden tint on ceiling halo, walls near fixture, and surfaces directly lit
- Cool LED → clean cool white tint
- Colored LED / RGB → that color bleeds visibly onto adjacent surfaces (walls, ceiling, furniture)
- The wash is strongest near the fixture and fades with distance

═══ F) REFLECTIONS & BOUNCE LIGHT ═══
- Glossy surfaces (TVs, mirrors, glass, polished wood, screens) must show a reflection of the fixture's bright glow
- Add subtle bounce light: surfaces near brightly lit walls pick up a faint tint of that wall's color
- Eyes / glasses / shiny objects can show a tiny bright highlight from the fixture

═══ G) ATMOSPHERIC EFFECTS ═══
- Add a subtle atmospheric glow / haze around the bulb to convey real luminance
- If the fixture is very bright (chandelier, large pendant, strong LED), allow faint visible light beams projecting downward / outward
- Add a slight lens-style bloom around the brightest emissive points

═══════════════════════════════════
VISUAL TARGETS — THE OUTPUT MUST SHOW:
═══════════════════════════════════
☐ A bright, large halo on the ceiling/wall around the fixture (visible from across the room)
☐ At least 3 distinct shadows from existing objects, all pointing away from the fixture
☐ Visibly brighter walls including the far walls
☐ A bright pool/cone of light on the floor or nearest surface below the fixture
☐ The fixture's color temperature visibly tinting adjacent surfaces
☐ At least one reflection on a glossy surface if any are present
☐ A clear sense that this is a long-exposure photograph of a lit room — not a fixture pasted onto a dim photo

If any of these are missing, the output is incorrect.

═══════════════════════════════════
ABSOLUTE RULES — DO NOT VIOLATE
═══════════════════════════════════
✗ DO NOT add, remove, or move any furniture, objects, plants, or decor
✗ DO NOT change wall colors, flooring, paint, or textures (color BLEED from the fixture is allowed and expected, but the underlying surface color stays the same)
✗ DO NOT change the camera angle, framing, crop, or aspect ratio
✗ DO NOT invent a different room or replace any part of it
✗ DO NOT add extra fixtures beyond the one provided
✗ DO NOT modify the fixture's design, shape, or color
✗ DO NOT add people, pets, or text overlays
✗ DO NOT apply a flat color filter over the whole image — lighting must be physically directional and falloff-based

✓ DO realistically illuminate the room with the new fixture as the prompt describes
✓ DO cast new shadows from existing objects based on the fixture's position
✓ DO let the fixture's color subtly bleed onto nearby surfaces
✓ DO adjust the perceived brightness of the room near the fixture
✓ DO add reflections on glossy surfaces where physically accurate

═══════════════════════════════════
OUTPUT
═══════════════════════════════════
Return a single photorealistic image, same aspect ratio and resolution as the room photo, indistinguishable from a real photograph taken in that room with the fixture installed and switched on.`;

export type GeneratePayload = {
  generationId: string;
  userId: string;
  roomPath: string;
  lightPath: string;
};

export const generateVisualization = task({
  id: "generate-visualization",
  maxDuration: 240,
  run: async (payload: GeneratePayload) => {
    const { generationId, userId, roomPath, lightPath } = payload;
    const supabase = createSupabaseAdminClient();

    logger.log("Starting generation", {
      generationId,
      userId,
      roomPath,
      lightPath,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8),
      geminiKeyPresent: !!process.env.GEMINI_API_KEY,
    });

    // Diagnostic: list buckets visible to the admin client.
    const { data: buckets, error: bucketsErr } =
      await supabase.storage.listBuckets();
    logger.log("Visible buckets to admin client", {
      buckets: buckets?.map((b) => b.name),
      error: bucketsErr?.message,
    });

    await supabase
      .from("generations")
      .update({ status: "running", model: MODEL, prompt: MASTER_PROMPT })
      .eq("id", generationId);

    try {
      // lightBlob is the FIXTURE (IMAGE 1), roomBlob is the SCENE (IMAGE 2).
      const [lightBlob, roomBlob] = await Promise.all([
        downloadAsBase64(supabase, lightPath),
        downloadAsBase64(supabase, roomPath),
      ]);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          { text: MASTER_PROMPT },
          {
            inlineData: {
              mimeType: lightBlob.mimeType,
              data: lightBlob.base64,
            },
          },
          {
            inlineData: {
              mimeType: roomBlob.mimeType,
              data: roomBlob.base64,
            },
          },
        ],
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData?.data);
      if (!imagePart?.inlineData?.data) {
        const textNote = parts.find((p) => p.text)?.text ?? "no image returned";
        throw new Error(`Gemini returned no image. Note: ${textNote}`);
      }

      const resultBytes = Buffer.from(imagePart.inlineData.data, "base64");
      const resultPath = `${userId}/${generationId}/result.png`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(resultPath, resultBytes, {
          contentType: imagePart.inlineData.mimeType ?? "image/png",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      await supabase
        .from("generations")
        .update({
          status: "succeeded",
          result_image_path: resultPath,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      logger.log("Generation succeeded", { generationId, resultPath });
      return { resultPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Generation failed", { generationId, message });

      await supabase
        .from("generations")
        .update({
          status: "failed",
          error: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      throw err;
    }
  },
});

async function downloadAsBase64(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  path: string,
): Promise<{ base64: string; mimeType: string }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = data.type || "image/jpeg";
  return { base64, mimeType };
}
