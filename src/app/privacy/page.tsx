import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Plumely",
  description: "How Plumely collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-sm text-ink-soft mb-10">Last updated: 20 May 2026</p>

      <div className="prose prose-neutral max-w-none space-y-6 leading-relaxed">
        <p>
          This Privacy Policy explains how Plumely (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          collects, uses, stores and shares your personal information when you use our website at{" "}
          <strong>plumely.ai</strong> and our AI image generation service (the &quot;Service&quot;).
        </p>
        <p>
          We are based in South Africa and this policy is governed by the{" "}
          <strong>Protection of Personal Information Act, 2013 (POPIA)</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-10">1. Who we are</h2>
        <p>
          Plumely is an AI image generation service that helps customers of lighting shops visualise
          how a light fitting will look in their own room. Customers typically access the Service by
          scanning a QR code in-store, uploading a photo of the room and the chosen light, and
          receiving an AI-generated preview image.
        </p>
        <p>
          For any privacy-related questions, contact us at{" "}
          <a href="mailto:[email protected]" className="underline">
            [email protected]
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-10">2. What information we collect</h2>
        <p><strong>Information you provide directly:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Photographs you upload (photos of your room and the light fitting)</li>
          <li>Optional text notes you add to describe your preferences</li>
          <li>Your email address, if you choose to have a generated design emailed to you</li>
        </ul>
        <p><strong>Information collected automatically:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your IP address (used for rate limiting and fraud prevention)</li>
          <li>Basic device and browser information</li>
          <li>Anonymous session identifiers</li>
          <li>Cloudflare bot-protection signals</li>
        </ul>
        <p><strong>Information we do NOT collect:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>We do not ask for your name, address, ID number, or payment details</li>
          <li>We do not knowingly collect special personal information</li>
          <li>We do not use third-party advertising trackers or cookies</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10">3. Why we collect it</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li><strong>To provide the Service</strong> — generating the preview image you requested</li>
          <li><strong>To deliver designs by email</strong> — only when you specifically request this</li>
          <li><strong>To protect the Service</strong> — rate limiting, bot detection, abuse prevention</li>
          <li><strong>To improve the Service</strong> — analysing aggregate usage patterns</li>
          <li><strong>To comply with legal obligations</strong> — when required by South African law</li>
        </ol>

        <h2 className="text-xl font-semibold mt-10">4. Legal basis (POPIA)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Your consent</strong> — given when you upload photos and use the Service</li>
          <li><strong>Performance of a contract</strong> — to deliver the Service you requested</li>
          <li><strong>Our legitimate interests</strong> — security, fraud prevention, and Service improvement</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10">5. How long we keep your information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Uploaded photos and generated images:</strong> stored indefinitely. You may request deletion at any time</li>
          <li><strong>Email addresses:</strong> stored indefinitely if you opted to receive a design by email</li>
          <li><strong>IP addresses:</strong> retained for up to 30 days</li>
          <li><strong>Server logs:</strong> retained for up to 90 days</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10">6. Who we share it with</h2>
        <p>
          We share your information only with the following service providers: Supabase (database
          and file storage), Vercel (hosting), Google Gemini (AI image generation), Cloudflare (bot
          protection), Trigger.dev (background jobs), Resend (email delivery), and Upstash
          (rate-limiting). Some providers process data outside South Africa under
          data-protection commitments equivalent to POPIA.
        </p>
        <p><strong>We do not sell your personal information to anyone, ever.</strong></p>

        <h2 className="text-xl font-semibold mt-10">7. International transfers</h2>
        <p>
          Your information may be transferred to and stored in countries outside South Africa,
          including the USA and EU. We only use providers who maintain adequate data-protection
          standards.
        </p>

        <h2 className="text-xl font-semibold mt-10">8. Security</h2>
        <p>We take reasonable technical and organisational steps to protect your information:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Encryption in transit (HTTPS / TLS)</li>
          <li>Server-side rate limiting</li>
          <li>Bot protection via Cloudflare Turnstile</li>
          <li>File type verification on all uploads</li>
          <li>Access controls and authentication</li>
          <li>Regular security review of our codebase</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10">9. Your rights under POPIA</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li><strong>Right of access</strong> — to know what information we hold about you</li>
          <li><strong>Right to correction</strong> — to ask us to correct inaccurate information</li>
          <li><strong>Right to deletion</strong> — to ask us to delete your information</li>
          <li><strong>Right to object</strong> — to object to certain types of processing</li>
          <li><strong>Right to withdraw consent</strong> — at any time, where we rely on consent</li>
          <li><strong>Right to complain</strong> — to the Information Regulator</li>
        </ol>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:[email protected]" className="underline">[email protected]</a>.
          We will respond within 30 days.
        </p>
        <p>
          <strong>Information Regulator (South Africa):</strong><br />
          Website:{" "}
          <a href="https://inforegulator.org.za" className="underline" target="_blank" rel="noopener noreferrer">
            inforegulator.org.za
          </a>
        </p>

        <h2 className="text-xl font-semibold mt-10">10. Children and minors</h2>
        <p>
          Our Service is available to users under the age of 18. If you are under 18, you must
          have permission from a parent or legal guardian to use the Service. A parent or guardian
          may contact us at any time to request deletion of information relating to a minor.
        </p>

        <h2 className="text-xl font-semibold mt-10">11. Cookies and tracking</h2>
        <p>
          We use only essential cookies: authentication cookies (to keep you signed in) and
          Cloudflare Turnstile cookies (for bot protection). We do <strong>not</strong> use
          advertising cookies, analytics trackers, or third-party tracking pixels.
        </p>

        <h2 className="text-xl font-semibold mt-10">12. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
          the top will be revised, and material changes will be communicated more prominently.
        </p>

        <h2 className="text-xl font-semibold mt-10">13. Contact us</h2>
        <p>
          <strong>Plumely</strong><br />
          Email:{" "}
          <a href="mailto:[email protected]" className="underline">[email protected]</a><br />
          Website:{" "}
          <a href="https://plumely.ai" className="underline">https://plumely.ai</a>
        </p>
      </div>
    </main>
  );
}