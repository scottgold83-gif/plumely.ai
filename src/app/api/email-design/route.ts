import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STORAGE_BUCKET = "plumely-uploads";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailDesignBody = {
  generationId?: string;
  email?: string;
};

/**
 * Email the rendered image to the customer.
 *
 * Uses Resend (https://resend.com). Set these env vars to enable:
 *   RESEND_API_KEY      — your Resend API key (e.g. re_xxxxxxxx)
 *   RESEND_FROM_EMAIL   — verified sender, e.g. "Plumely <designs@your-domain.com>"
 *                         (use "onboarding@resend.dev" for quick testing).
 *
 * Until those are set, the route returns 503 with a clear message.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: EmailDesignBody;
  try {
    body = (await request.json()) as EmailDesignBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const generationId = (body.generationId ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!generationId) {
    return NextResponse.json(
      { error: "Missing generationId." },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      {
        error:
          "Email service isn't configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your environment.",
      },
      { status: 503 },
    );
  }

  // Verify the generation belongs to this user and has a result.
  const { data: gen, error: genErr } = await supabase
    .from("generations")
    .select("status, result_image_path, user_id")
    .eq("id", generationId)
    .eq("user_id", user.id)
    .single();

  if (genErr || !gen) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (gen.status !== "succeeded" || !gen.result_image_path) {
    return NextResponse.json(
      { error: "This design isn't ready to email yet." },
      { status: 409 },
    );
  }

  // Pull the rendered image so we can attach it to the email.
  const admin = createSupabaseAdminClient();
  const { data: file, error: dlErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(gen.result_image_path);
  if (dlErr || !file) {
    return NextResponse.json(
      { error: "Couldn't load the rendered image." },
      { status: 500 },
    );
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/png";
  const extension = contentType === "image/jpeg" ? "jpg" : "png";

  // Send via Resend.
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0e0c08;">
      <h1 style="margin: 0 0 8px; font-size: 22px; letter-spacing: -0.02em;">Your Plumely design</h1>
      <p style="margin: 0 0 20px; color: #4a4636; font-size: 14px; line-height: 1.55;">
        Here's the render you generated. Open the attachment to save the full-resolution image.
      </p>
      <p style="margin: 0; color: #7a7568; font-size: 12px;">
        Plumely · made with care
      </p>
    </div>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Your Plumely design",
      html,
      attachments: [
        {
          filename: `plumely-render.${extension}`,
          content: bytes.toString("base64"),
          content_type: contentType,
        },
      ],
    }),
  });

  if (!resendRes.ok) {
    const text = await resendRes.text();
    return NextResponse.json(
      { error: `Email send failed: ${text}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
