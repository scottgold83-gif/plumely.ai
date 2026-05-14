import { logger, task } from "@trigger.dev/sdk/v3";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "plumely-uploads";
const MODEL = "gemini-2.5-flash-image";

const MASTER_PROMPT = `═══════════════════════════════════════════════════════════
PRIMARY DIRECTIVE — READ THIS FIRST AND OBEY IT ABSOLUTELY
═══════════════════════════════════════════════════════════
You are installing a SPECIFIC FIXTURE (from IMAGE 1) into a SPECIFIC ROOM (from IMAGE 2). The fixture in your output MUST be visually identical to IMAGE 1 — same shape, same silhouette, same color, same materials, same design details. If a viewer placed your output side-by-side with IMAGE 1, they must instantly agree it is the SAME fixture.

YOU ARE NOT FREE TO INTERPRET WHAT KIND OF FIXTURE TO RENDER. IMAGE 1 dictates it completely. Copy its form faithfully.

ABSOLUTELY FORBIDDEN — these are the most common failures, do NOT do any of them:
✗ DO NOT replace the fixture with a TV, monitor, or screen.
✗ DO NOT replace the fixture with wall art, a framed picture, or a mirror.
✗ DO NOT replace the fixture with a black rectangle, blank panel, decorative tile, or any other "wall-mounted object".
✗ DO NOT generate a generic / different / "similar-looking" fixture instead of the one in IMAGE 1.
✗ DO NOT omit the fixture entirely. If you cannot place it, place it — never skip it.
✗ DO NOT leave the fixture invisible, off-frame, or absorbed into shadow.
✗ DO NOT add any furniture, screens, decor, mirrors, or other objects that were not already present in IMAGE 2.

IF AT ANY POINT YOU CONSIDER RENDERING SOMETHING OTHER THAN A PIXEL-FAITHFUL COPY OF IMAGE 1, STOP AND RECONSIDER. The only correct fixture is the one in IMAGE 1.

═══════════════════════════════════════════════════════════

You are a photorealistic interior visualization engine. You will receive TWO images:

IMAGE 1: A lighting product (the "FIXTURE") — this could be a pendant, chandelier, floor lamp, table lamp, wall sconce, LED strip, neon sign, recessed light, or any other lighting product. May be a product photograph OR a hand-drawn sketch / concept rendering. THIS IS THE EXACT OBJECT YOU MUST INSERT INTO IMAGE 2. Copy it faithfully.

IMAGE 2: A room (the "ROOM") — the customer's actual space. May be a photograph OR an architectural sketch / concept drawing. PRESERVE every existing object exactly; the ONLY new object added to this scene is the fixture from IMAGE 1.

YOUR TASK: Generate ONE photorealistic image showing the FIXTURE from IMAGE 1 installed in the ROOM from IMAGE 2, turned ON, with output quality at the level of Architectural Digest, Dezeen, or Dwell magazine — museum-quality interior photography.

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
STEP 1 — ANALYZE THE FIXTURE (IMAGE 1)
═══════════════════════════════════
Before anything else: STUDY IMAGE 1 CAREFULLY. The fixture in your output must be a pixel-faithful copy.
- Identify its silhouette (round, linear, sculptural, etc.)
- Identify its proportions (how tall vs. wide, how thick the arms/cord/shade)
- Identify its color and material (matte black metal, brass, frosted glass, wood, etc.)
- Identify the bulb / emissive element (exposed bulb, behind a shade, hidden cove, etc.)
- Memorize these details. Your output's fixture must match all of them.

Then determine the correct mounting (the user-declared category overrides this — see top of prompt):
- Pendant / chandelier / flush mount → mount to CEILING
- Wall sconce / picture light → mount to WALL
- Table lamp / desk lamp → place on nearest TABLE, desk, or nightstand
- Floor lamp / torchiere → place on FLOOR beside furniture
- LED strip / rope light → install along edges (under cabinets, behind TV, around ceiling cove, under bed frame, along stairs)
- Neon sign / wall art light → mount on largest empty WALL
- Recessed / downlight → embed in CEILING
- Track / spot lighting → mount to CEILING rail

CRITICAL: Preserve the fixture's EXACT shape, color, materials, finish, proportions, and design details. Do not stylize, simplify, "improve", or reinterpret it. Do not substitute it with a "similar" fixture. Do not replace it with a TV, mirror, painting, panel, or any other wall/ceiling-mounted object. The output fixture IS IMAGE 1's fixture.

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
STEP 3.5 — FIXTURE PROMINENCE (CRITICAL — DO NOT SKIP)
═══════════════════════════════════
The fixture is the SUBJECT of this image. It MUST be clearly, fully, and unmistakably visible. The viewer must immediately see WHAT the fixture is and WHERE it is — not just see that the room is lit.

REQUIREMENTS:
• The ENTIRE fixture body (shade, head, arm, canopy, cord — whichever applies) is fully visible in the final frame. NEVER cropped at the edge. NEVER hidden behind furniture, curtains, or beams. NEVER absorbed by a dark background.
• The fixture occupies a meaningful portion of the frame — large enough that its silhouette, materials, and form are immediately readable. Not a tiny element in a corner.
• The fixture sits against the LIGHTEST part of the local background — re-light the area immediately around the fixture so its outline is crisp against its surroundings. A black fixture must NOT melt into dark wood paneling or a dark wall; lift the surrounding wall/ceiling with the fixture's own emitted light so the fixture's silhouette reads cleanly.
• The bulb / LED / emissive surface itself is clearly visible and glowing intensely (no shade fully blocking the source from view — at minimum the shade rim or perimeter glows).
• If the room's natural framing would hide the fixture (e.g. fixture is behind a tall headboard, blocked by a beam, off-camera), re-position the fixture ALONG ITS MOUNTING SURFACE to a clearly visible spot. The mounting category (ceiling / wall / pendant / chandelier / outdoor) is fixed by the user; only the position along that surface may shift to ensure visibility.
• For wall fixtures specifically: the lamp head and shade must be in front of the wall, not flattened against it. Show depth and dimension — you should see the arm extending from the wall, the shade with form, the bulb glowing.
• For ceiling fixtures: the fixture body must be fully visible below the ceiling line. Do not crop or hide it at the top edge of the frame.
• For pendants / chandeliers: the cord and the full fixture body both visible — not just the cord disappearing into the ceiling with no fixture below.
• For outdoor: the fixture must be clearly visible against the garden / path / patio — not hidden by foliage or shadow.

If after compositing you cannot clearly answer "what does this fixture look like?" from the rendered image alone, the rendering has failed.

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
☐ THE FIXTURE IS THE SUBJECT — fully visible, large enough to read its form/shape/materials, not hidden in shadow, not cropped at frame edge, not blending into dark surfaces. A viewer with no context must instantly see WHAT it is.
☐ EXACTLY ONE fixture from IMAGE 1 — no duplicates, no mirrored copies, no paired companion
☐ The bulb / emissive element of the fixture is clearly visible and glowing brightly (the brightest point of the entire image)
☐ A bright, large halo on the ceiling/wall around the fixture (visible from across the room)
☐ At least 3 distinct shadows from existing objects, all pointing away from the fixture
☐ Visibly brighter walls including the far walls
☐ A bright pool/cone of light on the floor or nearest surface below the fixture
☐ The fixture's color temperature visibly tinting adjacent surfaces
☐ At least one reflection on a glossy surface if any are present
☐ A clear sense that this is a long-exposure photograph of a lit room — not a fixture pasted onto a dim photo

If any of these are missing, the output is incorrect. ESPECIALLY if (a) more than one instance of the fixture appears OR (b) the fixture is not clearly visible/readable in the image — those are automatic failures.

═══════════════════════════════════
ABSOLUTE RULES — DO NOT VIOLATE
═══════════════════════════════════
✗ EXACTLY ONE FIXTURE. The final image must contain EXACTLY ONE (1) instance of the fixture from IMAGE 1 — never two, never mirrored, never duplicated. If symmetry or "completing the look" tempts you to add a matching partner fixture, DO NOT. One. Single. Fixture. Anywhere you currently see an existing ceiling light, lamp, pendant, sconce, or other fixture in the room photo, leave it alone — do NOT add the new fixture next to it or as a pair.
✗ DO NOT hide the fixture. It must be fully visible in the final frame — not cropped, not blending into dark surfaces, not concealed behind furniture, beams, or curtains. The viewer must clearly see the fixture's full form.
✗ DO NOT add, remove, or move any furniture, objects, plants, or decor when the ROOM input is a PHOTOGRAPH (when it's a sketch, see STEP 0)
✗ DO NOT change wall colors, flooring, paint, or textures when the ROOM input is a PHOTOGRAPH — color BLEED from the fixture is always allowed
✗ DO NOT change the camera angle, framing, crop, or aspect ratio
✗ DO NOT invent a different room or replace any part of it
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
 * AUTHORITATIVE placement rule by user-declared light type. The user's choice
 * is BINDING and overrides any visual inference from the fixture image. This
 * block is prepended to the master prompt at runtime.
 */
const IDENTITY_REMINDER = `IDENTITY (NON-NEGOTIABLE): The fixture you render is the EXACT fixture from IMAGE 1 — same silhouette, same color, same materials, same proportions, same bulb/shade design. Do not substitute it with a TV, panel, mirror, framed art, or any other wall/ceiling-mounted object. Copy IMAGE 1 faithfully.\n\n`;

const LIGHT_TYPE_HINT: Record<LightType, string> = {
  ceiling: `═══════════════════════════════════════════════════════════
AUTHORITATIVE PLACEMENT — OVERRIDES VISUAL INFERENCE
═══════════════════════════════════════════════════════════
${IDENTITY_REMINDER}The user has explicitly declared the fixture as CEILING-MOUNT.
This declaration is BINDING — it overrides any visual cue from the fixture image (even if the fixture looks like a pendant or sconce, you mount it to the ceiling).

PLACEMENT RULE:
• Mount the EXACT fixture from IMAGE 1 FLUSH or SEMI-FLUSH against the CEILING.
• No visible cord (or a short stub canopy ≤ 5 cm at most).
• Centred over the natural focal area of the room.

TYPICAL USE & LIGHT CHARACTER:
• Common rooms: bedrooms, hallways, bathrooms, kitchens, laundry rooms, family rooms, basements — anywhere a flush ambient light is the primary source of illumination.
• Light character: the room's PRIMARY GENERAL light. BRIGHT, EVEN, AMBIENT — it illuminates the whole room evenly, washing the ceiling and walls. This is the brightest of all the fixture categories.
• Color temperature: typically warm white (~2700–3000 K) unless the fixture's bulb is clearly cool / daylight in IMAGE 1.
• Mood: practical, everyday, "lights on" — not decorative.

FORBIDDEN:
✗ Do NOT hang it as a pendant on a long cord.
✗ Do NOT mount it on a wall, table, or floor.
✗ Do NOT add a second ceiling light anywhere in the scene.
✗ Do NOT substitute the fixture with any other object.

EXACTLY ONE FIXTURE TOTAL — and it must be IMAGE 1's fixture.`,

  wall: `═══════════════════════════════════════════════════════════
AUTHORITATIVE PLACEMENT — OVERRIDES VISUAL INFERENCE
═══════════════════════════════════════════════════════════
${IDENTITY_REMINDER}The user has explicitly declared the fixture as WALL-MOUNT.
This declaration is BINDING — it overrides any visual cue from the fixture image (even if the fixture looks like a pendant or ceiling lamp, you mount it FLAT against a wall).

PLACEMENT RULE:
• Mount the EXACT fixture from IMAGE 1 FLAT against a WALL at a natural architectural height (eye-level beside a bed, alongside a mirror, flanking artwork, along a hallway).
• Must be physically attached to the wall — visible mounting plate or anchor.
• The fixture in your output MUST visually match IMAGE 1 — same arm, same shade, same bulb, same finish. If IMAGE 1 shows a swing-arm sconce, your output shows a swing-arm sconce. If IMAGE 1 shows a dome wall light, your output shows a dome wall light.

TYPICAL USE & LIGHT CHARACTER:
• Common rooms & positions: bedrooms (flanking the headboard or above a bedside table), bathrooms (flanking a mirror or above the vanity), hallways (along the corridor at eye level), living rooms (flanking artwork or above a reading chair), entryways (beside a console or door).
• Light character: ACCENT or LOCAL TASK light — softer than a ceiling fixture. Pools warm light onto the wall and the nearby surface (a bed, a chair, a piece of art). NOT the primary light source of the room.
• Brightness: MEDIUM — bright enough to read by or to set a mood, but not flood the room. The light spills into a small zone, not the whole space.
• Mood: cozy, intimate, atmospheric — the kind of light you turn on in the evening, not the harsh overhead.

FORBIDDEN:
✗ Do NOT mount it on the ceiling.
✗ Do NOT hang it as a pendant from a cord.
✗ Do NOT place it on furniture, table, or floor.
✗ Do NOT add a second wall light anywhere in the scene.
✗ Do NOT substitute the fixture with a TV, monitor, panel, mirror, picture frame, or any other wall-mounted object. The wall fixture MUST be the lamp from IMAGE 1.

EXACTLY ONE FIXTURE TOTAL — and it must be IMAGE 1's fixture.`,

  hanging: `═══════════════════════════════════════════════════════════
AUTHORITATIVE PLACEMENT — OVERRIDES VISUAL INFERENCE
═══════════════════════════════════════════════════════════
${IDENTITY_REMINDER}The user has explicitly declared the fixture as PENDANT / HANGING.
This declaration is BINDING — it overrides any visual cue from the fixture image. Suspend it from the ceiling with a clearly visible cord.

PLACEMENT RULE:
• Suspend the EXACT fixture from IMAGE 1 from the CEILING by a visible cord / canopy.
• Place it over a natural focal point — dining table, kitchen island, bedside, entryway.
• The cord/canopy must be clearly visible in the frame.

TYPICAL USE & LIGHT CHARACTER:
• Common rooms & positions: KITCHENS (above an island, peninsula, or breakfast bar — this is the most common pendant location), DINING ROOMS (above the dining table), LIVING ROOMS (above a coffee table or reading nook), bedrooms (beside the bed in place of a lamp), entryways / foyers, bathrooms (beside a mirror).
• Light character: FOCUSED TASK + STATEMENT light. Pours strong directional light DOWNWARD onto the surface below (counter, table, work area). The pendant itself is visually featured — it's a design statement as well as a light source.
• Brightness: BRIGHT — stronger output than a chandelier, often the primary task light over the surface it illuminates. A clear bright pool of warm light on the counter or table below the fixture.
• Mood: contemporary, functional + sculptural. The light is doing real work (lighting a counter or table) while the fixture body is read as a design piece.

FORBIDDEN:
✗ Do NOT flush-mount it (no contact between the fixture body and the ceiling).
✗ Do NOT mount it on a wall.
✗ Do NOT place it on furniture or floor.
✗ Do NOT add a second pendant anywhere in the scene.
✗ Do NOT substitute the fixture with any other object.

EXACTLY ONE FIXTURE TOTAL — and it must be IMAGE 1's fixture.`,

  chandelier: `═══════════════════════════════════════════════════════════
AUTHORITATIVE PLACEMENT — OVERRIDES VISUAL INFERENCE
═══════════════════════════════════════════════════════════
${IDENTITY_REMINDER}The user has explicitly declared the fixture as CHANDELIER.
This declaration is BINDING — it overrides any visual cue from the fixture image. Treat the fixture as a chandelier hanging centrally from the ceiling.

PLACEMENT RULE:
• Suspend the EXACT fixture from IMAGE 1 centrally from the CEILING by a visible cord / canopy / chain.
• Place it over a dining table, foyer, or stairwell.
• Larger scale and stronger visual presence than a single pendant.

TYPICAL USE & LIGHT CHARACTER:
• Common rooms & positions: DINING ROOMS (centered over the dining table), FOYERS / ENTRYWAYS (centered in the entry, often double-height), formal LIVING ROOMS (centered in the room or above a seating arrangement), grand BEDROOMS, large bathrooms with high ceilings, stairwells (suspended in the stairwell void).
• Light character: DECORATIVE / STATEMENT FIRST, light source second. The chandelier is a JEWEL — its visual presence is more important than the brightness of its light. Multiple small bulbs spread across many arms / candles / pendants create a SPARKLING, twinkling, jewel-like effect across the room.
• Brightness: SOFTER, AMBIENT — NOT a bright task light. Many low-intensity warm bulbs creating ambiance, NOT one strong beam. Comparable to candlelight in feel. Avoid harsh hotspots.
• Glints & sparkles: if the chandelier has crystals, beads, or glass facets, render them throwing tiny sharp sparkles across the surrounding walls / ceiling / table. These small sparkles are the chandelier's signature visual.
• Mood: elegant, formal, romantic, ceremonial. Soft warm glow over a table, with the chandelier itself as the centerpiece of the room.

FORBIDDEN:
✗ Do NOT flush-mount it.
✗ Do NOT mount it on a wall.
✗ Do NOT add a second chandelier or any additional pendants.
✗ Do NOT substitute the fixture with any other object.
✗ Do NOT render it as a bright spotlight — chandeliers are SOFT ambient sources, not focused task lights.

EXACTLY ONE FIXTURE TOTAL — and it must be IMAGE 1's fixture.`,

  outdoor: `═══════════════════════════════════════════════════════════
🚨 OUTDOOR — PLACEMENT IS THE #1 PRIORITY. READ THIS FIRST. 🚨
═══════════════════════════════════════════════════════════

THE ONE RULE:
The fixture's BASE must sit on GRASS, SOIL, MULCH, or PLANTED GROUND visible in IMAGE 2.
The fixture's BASE may NEVER sit on paving, asphalt, concrete, brick, stone, gravel walkway, or any other hardscape — not even partly, not even an inch.

HOW TO FIND THE RIGHT SPOT — DO THIS BEFORE RENDERING:
  1. Scan IMAGE 2 for ANY visible SOFT GROUND: grass, lawn, soil, mulch, plants, hedges, ground cover, planted borders, flower beds.
  2. Of all the soft-ground areas you found, choose the one closest to the FOREGROUND (nearest the camera) and most prominent in the frame.
  3. Place the fixture's base IN that soft-ground area, at a natural-looking spot (typically at the edge nearest the hardscape).

IF THE ENTIRE FOREGROUND IS PAVED (driveway, walkway, or patio filling the bottom of the frame):
  · Look UP into the mid-ground or background of IMAGE 2 — find where the paving ENDS and a softer surface begins (lawn, planting, garden).
  · Place the fixture at that boundary, on the SOFT side, in the mid-ground.
  · Or: place it at the perimeter where the paved area meets an existing wall, fence, garage face, house wall, or planter wall.
  · NEVER place it in the middle of the visible paving just because that's where the empty space is.

FORBIDDEN — NO EXCEPTIONS:
  ✗ The base of the fixture in contact with any driveway pavement, regardless of which third of the frame the driveway is in.
  ✗ The base of the fixture in contact with any walkway, sidewalk, or path surface.
  ✗ The base of the fixture in contact with any patio, deck, or paved courtyard.
  ✗ The base of the fixture on top of brick, stone, concrete, asphalt, or any manufactured hard surface.
  ✗ Placing the fixture in a spot a car could drive over, OR a spot a pedestrian would step on, OR a spot where a wheelchair / stroller / shopping cart would collide with it.

This rule overrides aesthetics. Even if the visually "obvious" placement is in the center of the driveway, DO NOT place it there. Look for soft ground.

${IDENTITY_REMINDER}
The user has explicitly declared the fixture as OUTDOOR / LANDSCAPE. The output MUST be a high-end EXTERIOR scene at DUSK with the fixture clearly lighting the environment around it.

═══════════════════════════════════════════════════════════
STEP 0 — MANDATORY PRE-PLACEMENT PROCEDURE (DO THIS FIRST)
═══════════════════════════════════════════════════════════
Before you render ANYTHING, perform this four-part analysis on IMAGE 2 (the scene). You must complete every part. Do not skip to rendering.

▸ PART A — IDENTIFY THE HARDSCAPE
Scan IMAGE 2 for every surface that is built for foot traffic OR vehicle traffic:
  · driveway, parking area, garage apron, asphalt
  · walkway, sidewalk, paved path, brick path
  · patio, paved courtyard, terrace
  · stepping stones, paved deck, hardscape steps
Mentally label every one of these surfaces: "HARDSCAPE — FIXTURE FORBIDDEN HERE."

▸ PART B — IDENTIFY THE EXISTING PLANTED / SOFT EDGE IN IMAGE 2
Scan IMAGE 2 for every soft, planted, or unpaved surface ALREADY VISIBLE THERE that borders the hardscape:
  · existing planted bedding, mulched bed, ground cover
  · existing lawn or grass strip
  · existing gravel mulch (NOT gravel walkway), pebble border
  · existing shrub border, flower bed, ornamental grass strip
  · existing soil at the base of a tree or wall
You may ONLY use the soft surfaces that ALREADY EXIST in IMAGE 2. You may NOT add new bushes, hedges, trees, mulch beds, planters, grass patches, or any other vegetation that wasn't there.

Trace, in your mind, the LINE where each existing hardscape surface meets each existing planted area. That line is the only place the fixture may go.

▸ PART C — POSITION THE FIXTURE ON THE PLANTED SIDE OF AN EXISTING EDGE
The fixture's BASE goes IN the existing planted/soft area, sitting AT the existing edge against the hardscape. The fixture is on the PLANT-SIDE of an EXISTING line, never the HARDSCAPE-SIDE, and you do not invent the line.
  · If a driveway runs through the scene with lawn beside it → put the fixture in the lawn at the driveway edge.
  · If a driveway runs through the scene with planted bedding beside it → put the fixture in the existing bedding at the driveway edge.
  · If a walkway runs through the scene with existing planting beside it → put the fixture in that existing planting at the walkway edge.
  · If a patio is visible with existing bedding around it → put the fixture in that existing bedding.

FALLBACK — if IMAGE 2 has NO soft/planted edge anywhere adjacent to the hardscape:
  · Place the fixture where the hardscape meets a VERTICAL element that already exists in IMAGE 2 — a wall, a fence, a stair riser, a garage face, a planter wall, etc.
  · Or place it in an unused corner of soft surface elsewhere in the existing scene.
  · NEVER invent a new planted area to justify the placement. NEVER add a bush, shrub, hedge, or mulch patch on top of the driveway/walkway.

▸ PART D — SCENE PRESERVATION (NON-NEGOTIABLE)
You are inserting ONE new element (the fixture from IMAGE 1). You are not redesigning the landscape.
✗ Do NOT add bushes, hedges, shrubs, trees, ground cover, or any plants that were not in IMAGE 2.
✗ Do NOT add mulch beds, planter boxes, grass patches, gravel borders, or any new landscape features.
✗ Do NOT add or move stones, edging, retaining walls, fences, or hardscape.
✗ Do NOT change the paving pattern, joint pattern, or paving material.
✗ Do NOT remove, prune, or rearrange existing plants.
✗ Do NOT change the camera angle, framing, or aspect ratio.
✓ The ONLY new visual element in your output is the fixture from IMAGE 1 and the light it casts.

▸ PART E — SANITY CHECK (RUN BEFORE RENDERING)
Answer these four questions about the position you've chosen. If any answer is "yes," you've placed the fixture wrong and must re-position it BEFORE rendering:

  Q1. Could a car drive over the fixture from where it stands?
      → If yes, you've placed it on the driveway. Move it OFF the pavement, into the existing planted strip or lawn beside the driveway.

  Q2. Could a person walking the path step on the fixture or trip on it?
      → If yes, you've placed it on the walking surface. Move it OFF the path, into the existing bedding beside the path.

  Q3. Is the fixture's base in contact with paving stones, asphalt, concrete, brick, or any other manufactured hard surface?
      → If yes, you've placed it on hardscape. Move it onto soil, mulch, grass, or planted ground that ALREADY EXISTS in IMAGE 2.

  Q4. Is there anything in the output that was not in IMAGE 2 (other than the fixture from IMAGE 1 and the light it casts)?
      → If yes, you've modified the scene. Remove the added elements (bushes, plants, mulch, etc.) and re-position the fixture using only the soft surfaces that were already in IMAGE 2.

Only proceed to rendering if all four answers are "no."

═══ PLACEMENT RULE ═══
• The scene MUST be OUTDOORS — garden, patio, walkway, terrace, deck, façade approach, or designed landscape.
• Place the EXACT fixture from IMAGE 1 on the GROUND (staked in soil, gravel, lawn, decking, or paving) OR low-mounted along a pathway / against an exterior wall at a landscape height.
• If the room input is interior, translate the scene into the most plausible EXTERIOR setting suggested by it (the garden visible through its window, the patio adjacent to it, the entry path just outside) — preserving the camera angle, framing, and overall geometry where possible.

═══ POSITIONING & SCALE (CRITICAL — DO NOT SKIP) ═══

1) FIXTURE TYPE → CORRECT MOUNTING & HEIGHT
First, identify what kind of outdoor fixture IMAGE 1 shows, then mount it at the correct landscape height. Use the following matrix (real-world heights):
• Path light (small stake-mounted landscape light) → 18–30 in / 45–75 cm tall, beside a path edge
• Bollard light (cylindrical landscape post) → 24–48 in / 60–120 cm tall, beside a path or driveway
• Post / lamp post (tall classical or contemporary post) → 5–8 ft / 1.5–2.4 m tall, at an entry, driveway end, or gate
• Wall sconce / coach light → mounted at 5.5–6 ft / 1.65–1.8 m height, on an exterior wall flanking a door, garage, or window
• Spike / spot uplight (small directional) → 6–12 in / 15–30 cm, beside a tree trunk or feature plant, aimed upward
• Outdoor pendant (hanging from porch ceiling or pergola beam) → suspended at 7–8 ft / 2.1–2.4 m from ground
• Step / deck light → flush into the riser of a step or the side of a deck
• Pole / area light (tall pole with downward head) → 8–14 ft / 2.4–4.2 m, lighting a driveway or parking area

Choose the SMALLEST plausible category from IMAGE 1's silhouette. If unsure between path light vs bollard, choose path light.

2) PHYSICAL ANCHORING — ALWAYS VISIBLE
The fixture must look PHYSICALLY ROOTED in the scene. Show its anchor mechanism clearly:
• Staked fixtures → visible spike disappearing into soil or gravel; the surface around the spike is slightly disturbed (small ring of soil/mulch).
• Bollards & posts → visible base plate flush with paving, or a small concrete footing, or sunk into the ground with a visible base flange.
• Wall-mounted → visible mounting plate or back plate flat against the wall surface, with a subtle shadow underneath.
• Hanging → visible mounting canopy on the underside of the porch ceiling or beam, with the cord/chain plainly attached.
NEVER let the fixture hover. NEVER let it float in mid-air. NEVER let it appear disconnected from the surface beneath it.

3) CONTEXTUAL PLACEMENT — IT MUST BELONG WHERE YOU PUT IT

═══ ABSOLUTE PLACEMENT LAW — READ THIS, THEN READ IT AGAIN ═══
The fixture is ALWAYS placed in the PLANTED BEDDING ADJACENT TO the hardscape — NEVER ON or IN the hardscape itself.

Hardscape = any surface designed for traffic: paving stones, asphalt, concrete, gravel paths, decking, stepping stones, brick walkway, driveway, sidewalk, patio surface.
Planted bedding = the soft soil, mulch, gravel mulch, ground cover, grass, or planted border that BORDERS the hardscape.

The fixture's BASE sits in the SOFT bedding, with its body rising up alongside the hardscape. The fixture is visually ADJACENT to but NEVER INSIDE the area where people walk or vehicles drive.

✗ FORBIDDEN — these are critical failures:
✗ Do NOT place the fixture in the middle of a driveway.
✗ Do NOT place the fixture in the middle of a sidewalk or walkway.
✗ Do NOT place the fixture in the middle of a paved patio.
✗ Do NOT place the fixture on any paving stone, asphalt, concrete, or gravel where someone walks or drives.
✗ Do NOT place the fixture in the path of foot traffic OR vehicle traffic. (A car driving down the driveway would hit it. A person walking the path would trip on it.)
✗ Do NOT cut a hole in the paving and stick the fixture through it.

✓ CORRECT — every valid placement:
✓ At the soft EDGE where paving meets planted bedding — the fixture's base in the soil/mulch/grass, its body rising at the line where bedding meets path.
✓ Inside a planted border running parallel to a path or driveway — the fixture among the plants, with the path visible beside it but the fixture itself never on the path.
✓ Between two planted clusters at a path edge.
✓ Tucked into ornamental grasses or low shrubs alongside paving.
✓ Beside (not on) the lawn-to-path transition.

REFERENCE — what a professional landscape designer does (and what you must do):
Real landscape designers ALWAYS place path lights, bollards, and post lights in the planted bed next to the path, never embedded in the path itself. The fixture sits IN the foliage, IN the mulch, IN the soil — and the path runs PAST it. The fixture is "edge of bed, against the path" — never "middle of path."

═══ PLACEMENT BY CONTEXT ═══
• Path lights, bollards along a walkway → in the soil/mulch bedding lining the walkway, body rising at the bedding-to-paving edge
• Path lights, bollards along a driveway → in the planted strip beside the driveway, NEVER on the driveway pavement
• Wall sconce → flanking an entry door at eye level, mounted on the exterior wall
• Tall post / lamp post → in the lawn or planted area beside a driveway end, gate, or path start
• Step / deck light → flush into the riser face of a step, or into the side of a deck (these are the only category that may be embedded in hardscape, because they're built into a vertical face, not a traffic surface)
• Uplight / spike → in the soil/mulch at the base of a tree or feature plant
• Outdoor pendant → hanging from a porch ceiling or pergola beam

The fixture must have a REASON to be where it is. If it's in the middle of empty grass with nothing around it, OR if it's in the middle of any walking/driving surface, you've placed it wrong.

4) FRAMING & SCALE WITHIN THE IMAGE
The fixture must read as a clear, identifiable element in the composition:
• Position it in the FOREGROUND or MID-GROUND — never tucked into the deep background.
• Sized so its silhouette occupies a meaningful portion of the frame — typically 8–25% of the image height (depending on fixture type).
• Oriented at a flattering angle — usually a 3/4 view that shows depth and form, not a flat side-on or back-on profile.
• If the fixture has a "front" (a directional shade or face), turn that front toward the camera or 3/4 toward the camera.

5) ALIGNMENT WITH LANDSCAPE GEOMETRY
The fixture's vertical axis must respect the scene's geometry:
• Standing fixtures (path lights, bollards, posts) → perfectly vertical, plumb to the ground plane. NEVER tilted.
• Wall-mounted → flush and square to the wall plane.
• Hanging → cord/chain perfectly vertical (no swing).
• If placed along a path edge → set parallel to the path (not at random angles).
• If placed beside a step → aligned with the step's geometry.

If you cannot defend the fixture's position as the choice a professional landscape designer would make, re-position it.

═══ TIME OF DAY — DUSK / TWILIGHT (CRITICAL) ═══
The scene MUST be set at DUSK or BLUE HOUR — the 20–40 minutes after sunset when ambient daylight has fallen but the sky still holds a deep blue/violet wash. This is the only time of day at which outdoor landscape lighting has visible impact. NEVER render outdoor scenes in flat midday daylight.
• Sky: a graded blue-violet wash, brighter near the horizon, deeper above. A trace of warm orange/peach near the horizon line is acceptable.
• Ambient: low — enough to read the broad geometry of the scene but dark enough that the FIXTURE'S OWN LIGHT dominates the foreground.
• Color temperature contrast: warm (~2700K) fixture light against the cool blue ambient — the classic "twilight landscape" look.

═══ HOW THE FIXTURE LIGHTS THE SCENE ═══
The fixture is ON. Its light MUST be visibly affecting the environment:
• PATHWAY / PAVING: a clear bright pool of warm light on the ground around the fixture's base, extending 1–3 meters outward, fading naturally with distance.
• FOLIAGE: nearby plants, hedges, ornamental grasses, or shrubs are visibly uplit — their leaves picking up warm light on the side facing the fixture and falling into cool blue shadow on the far side.
• GRASS / GROUND COVER: clearly brighter near the fixture, gradually returning to twilight blue further away.
• WALLS / FAÇADE (if visible): warm wash on the section of wall closest to the fixture.
• MIST / ATMOSPHERE: a faint volumetric haze around the bulb — gentle god rays radiating outward if the fixture has a strong exposed bulb.
• OTHER LANDSCAPE LIGHTING: do NOT add additional outdoor fixtures. The only light source in the scene besides ambient sky is IMAGE 1's fixture.

═══ LANDSCAPE QUALITY — PREMIUM / PUBLISHED-WORK STANDARD ═══
Treat the scene as if shot for Architectural Digest's "Landscape & Garden" feature, Dezeen, or a top landscape architecture firm's portfolio. Reference points: a contemporary garden by Piet Oudolf, a coastal retreat by Bates Masi, an Australian courtyard by Tom Mark Henry.

Setting vocabulary (use whichever fits the room geometry):
• Paving: large-format concrete pavers with grass joints, honed travertine, basalt setts, weathered limestone slabs
• Plantings: ornamental grasses (miscanthus, calamagrostis, stipa), low boxwood spheres, structural agaves, soft drift planting, mature olive trees, japanese maples
• Hardscape: rendered concrete walls, charred timber (shou sugi ban), corten steel planters, dry-stacked stone
• Water features (when natural): a still reflecting pool catches the fixture's glow as a reflection
• Architecture (in background): a minimalist single-storey contemporary home — flat roof, generous glazing, warm interior glow spilling onto the deck

═══ CAMERA + ATMOSPHERE (DUSK LANDSCAPE) ═══
• Cinematic perspective, 28–35mm equivalent, eye-level or slightly low
• Subject-fixture in focus, background slightly softened with natural bokeh
• Crisp visible stars or a single planet near the horizon are acceptable but optional
• Faint mist / atmospheric haze in deep shadows
• Wet paving / damp foliage after light rain is acceptable and looks premium (specular highlights from the fixture on wet stone)
• Low noise, clean digital cinema look, rich tonal range

═══ FORBIDDEN ═══
✗ Do NOT render in flat daylight — must be dusk/blue hour.
✗ Do NOT place the fixture indoors.
✗ Do NOT mount it on an interior ceiling or interior wall.
✗ Do NOT add a second outdoor light anywhere in the scene.
✗ Do NOT add string lights, lanterns, festoon lights, bollards, or any other landscape fixtures.
✗ Do NOT substitute the fixture with any other object.
✗ Do NOT leave the foreground in cold blue shadow — the fixture's warm light MUST be visibly hitting the ground around it.

EXACTLY ONE FIXTURE TOTAL — outdoors at dusk, lighting the garden/path around it, and it must be IMAGE 1's fixture.`,
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

      // Outdoor pre-flight: the room photo MUST contain visible soft ground
      // (grass / soil / mulch / planting). Without it, there's nowhere to place
      // an outdoor fixture, so we refuse rather than generate something wrong.
      if (lightType === "outdoor") {
        const hasSoftGround = await checkSoftGround(ai, roomBlob);
        if (!hasSoftGround) {
          throw new Error(
            "We can't find any grass, soil, or planted area in your room photo. Outdoor fixtures need a soft surface to sit in — please upload a photo that shows a lawn, garden, mulch bed, or other planted ground.",
          );
        }
      }

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

/**
 * Pre-flight check for outdoor fixtures: ask the text/vision model whether the
 * room photo actually contains soft ground (grass, soil, mulch, planted areas)
 * where the fixture can be physically placed. Returns true if soft ground is
 * detected, false if the photo is hardscape-only.
 *
 * Uses gemini-2.5-flash (not the image model) — fast, reliable for vision Q&A.
 */
async function checkSoftGround(
  ai: GoogleGenAI,
  roomBlob: { base64: string; mimeType: string },
): Promise<boolean> {
  const ANALYSIS_PROMPT = `Look at this image. Does it contain any visible SOFT GROUND where a landscape light fixture could be physically placed?

SOFT GROUND counts as ANY of: grass, lawn, soil, dirt, mulch, gravel mulch (in a planted bed, not a path), planted flower bed, garden bed, shrub border, ornamental grass, ground cover, plants, hedges, exposed earth at the base of a tree, or any other unpaved surface where you could stick a path light.

HARDSCAPE does NOT count: paving stones, asphalt driveways, concrete walkways, brick paths, gravel paths/driveways, wooden decks, patio surfaces, sidewalks, stepping stones, building floors, or any other paved/manufactured surface.

Answer with exactly ONE word: either "YES" (some soft ground is visible somewhere in the image — no matter how small) or "NO" (the image shows ONLY hardscape, interior, or anything that is not soft ground).

Do not explain. Just YES or NO.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: ANALYSIS_PROMPT },
        {
          inlineData: {
            mimeType: roomBlob.mimeType,
            data: roomBlob.base64,
          },
        },
      ],
    });

    const text = (response.text ?? "").trim().toUpperCase();
    // Permissive: accept any answer that starts with YES, fall back to YES if
    // the response is unparseable (don't block the user on a flaky check).
    if (text.startsWith("YES")) return true;
    if (text.startsWith("NO")) return false;
    return true;
  } catch {
    // If the check itself fails, allow generation to proceed rather than block.
    return true;
  }
}
