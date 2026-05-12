import { logger, task } from "@trigger.dev/sdk/v3";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "plumely-uploads";
const MODEL = "gemini-2.5-flash-image";

const MASTER_PROMPT = `You are a photorealistic interior visualization engine. You will receive TWO images:

IMAGE 1: A lighting product (the "FIXTURE") — this could be a pendant, chandelier, floor lamp, table lamp, wall sconce, LED strip, neon sign, recessed light, or any other lighting product. May be a product photograph OR a hand-drawn sketch / concept rendering.

IMAGE 2: A room (the "ROOM") — the customer's actual space. May be a photograph OR an architectural sketch / concept drawing.

YOUR TASK: Generate ONE photorealistic image showing the FIXTURE installed in the ROOM, turned ON, with output quality at the level of Architectural Digest, Dezeen, or Dwell magazine — museum-quality interior photography.

═══════════════════════════════════
STEP 0 — INPUT FORMAT DETECTION (CRITICAL)
═══════════════════════════════════
First, determine the input type for each image:

A) PHOTOGRAPH: A real photo of an existing space or product.
   → Preserve EVERYTHING exactly (geometry, materials, furniture, palette).
   → Only add the fixture and its light. The "Absolute Rules" below apply strictly.

B) SKETCH / LINE DRAWING / CONCEPT RENDER: A hand-drawn or schematic representation.
   → PRESERVE the architectural geometry (wall positions, ceiling height, openings, structural lines, camera angle, perspective).
   → TRANSLATE the sketch into a photorealistic interior using premium contemporary materials and finishes (see palette below).
   → For a fixture sketch: render it as a finished designer product with refined materials, micro-textures, and realistic optics.
   → For a room sketch: furnish and finish it as a high-end contemporary interior consistent with its geometry.

The "Absolute Rules" still apply to architectural geometry — never change wall positions, openings, ceiling height, or camera angle, even when translating a sketch.

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
✗ DO NOT add, remove, or move any furniture, objects, plants, or decor when the ROOM input is a PHOTOGRAPH (when it's a sketch, see STEP 0)
✗ DO NOT change wall colors, flooring, paint, or textures when the ROOM input is a PHOTOGRAPH — color BLEED from the fixture is always allowed
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
QUALITY STANDARD — MUSEUM-GRADE FINISH
═══════════════════════════════════
Output must read like a feature shoot in Architectural Digest, Dezeen, or Dwell.

MATERIAL VOCABULARY (use as appropriate to the room's apparent style):
- Walls: soft off-white plaster, warm limewash, honed Carrara or Calacatta marble cladding, polished or microcement concrete
- Floors: wide-plank European oak, polished concrete, honed travertine, large-format porcelain
- Joinery / cabinetry: matte black metalwork, brushed brass, light natural oak veneer, fluted oak, lacquered MDF
- Surfaces: bouclé upholstery, leather, raw silk, linen, hand-woven wool rugs
- Stone: Calacatta / Carrara / Taj Mahal quartzite — visible veining, honed (not polished) finish
- Glass: low-iron frameless glazing, slim aluminium / matte black framing

LIGHT FIXTURE FINISH (when translating a sketch into a refined product):
- Matte black or hand-blackened steel exterior
- Brushed brass or warm-tinted aluminum interior
- Sculpted curved dome / bell shades with micro-textured surface
- Integrated warm 2700K LEDs — visible filament suggestion in the bulb glass
- Caustics on adjacent marble / glass / metal surfaces
- Soft directional bloom + gentle bokeh from any background lights

CAMERA + ATMOSPHERE:
- Cinematic perspective, slight wide-angle compression (28–35mm equivalent)
- Subtle depth of field — foreground sharp, distant garden / window views softly blurred with natural bokeh
- Warm golden-hour daylight raking across surfaces — subtle volumetric god rays where light passes through openings
- Faint atmospheric haze in deep shadows — rich tonal range, never crushed black or blown highlights
- Low-noise / low-grain — clean digital cinema look

═══════════════════════════════════
OUTPUT
═══════════════════════════════════
Return a single photorealistic image, same aspect ratio and resolution as the room input. The result must be indistinguishable from a professional architectural photograph published in a top-tier interior magazine. No text, no logos, no watermarks, no compression artifacts.`;

export type LightType =
  | "ceiling"
  | "wall"
  | "hanging"
  | "chandelier"
  | "outdoor";

export type GeneratePayload = {
  generationId: string;
  userId: string;
  roomPath: string;
  lightPath: string;
  /** User-declared fixture category. Takes precedence over inference. */
  lightType?: LightType;
};

/**
 * Mounting rule by user-declared light type. Injected at the top of the
 * prompt at runtime when present.
 */
const LIGHT_TYPE_HINT: Record<LightType, string> = {
  ceiling:
    "USER-DECLARED LIGHT TYPE: CEILING-MOUNT. Treat the fixture as a flush- or semi-flush ceiling fixture. Mount it directly to the ceiling with no cord (or a very short stem). Centred over the natural focal area of the room.",
  wall:
    "USER-DECLARED LIGHT TYPE: WALL-MOUNT. Treat the fixture as a wall sconce or picture light. Mount it flush to a wall at a natural eye-level/architectural position — beside a bed, alongside a mirror, flanking an artwork, or along a hallway.",
  hanging:
    "USER-DECLARED LIGHT TYPE: HANGING / PENDANT. Treat the fixture as a pendant hanging on a cord from the ceiling. Suspend it from the ceiling with a visible cord/canopy. Place it over a natural focal point — dining table, kitchen island, bedside, entryway.",
  chandelier:
    "USER-DECLARED LIGHT TYPE: CHANDELIER. Treat the fixture as a multi-arm chandelier hanging from the ceiling. Suspend it centrally over a dining table, foyer, or stairwell. Larger scale and presence than a single pendant.",
  outdoor:
    "USER-DECLARED LIGHT TYPE: OUTDOOR. Treat the fixture as an exterior fixture — pathway, porch, sconce, or post light. Mount it appropriately in an outdoor architectural setting (entry, façade, deck, garden path).",
};

export const generateVisualization = task({
  id: "generate-visualization",
  maxDuration: 240,
  run: async (payload: GeneratePayload) => {
    const { generationId, userId, roomPath, lightPath, lightType } = payload;
    const supabase = createSupabaseAdminClient();

    // If the user declared a light type, prepend an authoritative hint so the
    // model treats that category as canonical and mounts the fixture accordingly.
    const finalPrompt = lightType
      ? `${LIGHT_TYPE_HINT[lightType]}\n\n${MASTER_PROMPT}`
      : MASTER_PROMPT;

    logger.log("Starting generation", {
      generationId,
      userId,
      roomPath,
      lightPath,
      lightType: lightType ?? "(none — model infers)",
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
      .update({ status: "running", model: MODEL, prompt: finalPrompt })
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
          { text: finalPrompt },
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
