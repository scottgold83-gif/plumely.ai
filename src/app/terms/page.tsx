import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Plumely",
  description: "The rules and agreement that govern your use of Plumely.",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
      <p className="text-sm text-ink-soft mb-10">Last updated: 20 May 2026</p>

      <div className="prose prose-neutral max-w-none space-y-6 leading-relaxed">
        <p>
          Welcome to <strong>Plumely</strong>. These Terms of Service (&quot;Terms&quot;) form a
          legal agreement between you (&quot;you&quot;, &quot;your&quot;) and Plumely
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) and govern your use of our website at{" "}
          <strong>plumely.ai</strong> and our AI image generation service (the &quot;Service&quot;).
        </p>
        <p>
          By using the Service, you agree to be bound by these Terms. If you do not agree, please
          do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-10">1. The Service</h2>
        <p>
          Plumely is an AI image generation tool designed to help shoppers at lighting stores
          visualise how a light fitting would look in their own room. You can upload a photo of
          your room and a photo of the light fitting, add an optional note, and receive an
          AI-generated preview image. The Service is provided free of charge unless we state
          otherwise.
        </p>

        <h2 className="text-xl font-semibold mt-10">2. Who can use the Service</h2>
        <p>The Service is available to anyone, including users under the age of 18.</p>
        <p>
          <strong>If you are under 18:</strong> You must have permission from a parent or legal
          guardian to use the Service. By using Plumely, you confirm that you have such
          permission.
        </p>
        <p>
          <strong>If you use the Service on behalf of a business:</strong> You confirm that you
          have authority to accept these Terms on its behalf.
        </p>

        <h2 className="text-xl font-semibold mt-10">3. Your account and session</h2>
        <p>
          You do not need to create a traditional account. We use anonymous sessions tied to your
          device and browser. You are responsible for any activity that happens during your
          session.
        </p>

        <h2 className="text-xl font-semibold mt-10">4. Acceptable use</h2>
        <p>You agree to use the Service responsibly. You must NOT:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Upload images you do not own or have permission to use</li>
          <li>Upload images depicting minors in any inappropriate context</li>
          <li>Upload images of identifiable individuals without their consent</li>
          <li>Upload illegal, obscene, violent, hateful, or harmful content</li>
          <li>Attempt to bypass our rate limits, bot protection, or security measures</li>
          <li>Attempt to reverse-engineer, scrape, or copy the Service</li>
          <li>Use the Service to generate misleading, deceptive, or fraudulent content</li>
          <li>Use the Service in any way that violates South African law</li>
        </ul>
        <p>
          We reserve the right to remove any content and suspend or terminate access to any user
          who breaches these rules.
        </p>

        <h2 className="text-xl font-semibold mt-10">5. Your content (uploads)</h2>
        <p>
          You retain ownership of the photos and text you upload. By uploading content, you grant
          us a non-exclusive, worldwide, royalty-free licence to store your uploads, process them
          through our AI providers (currently Google Gemini), generate the requested preview
          image, and use anonymised aggregated data to improve the Service.
        </p>
        <p>
          You confirm that you have the legal right to upload each photo. You can request deletion
          at any time by emailing{" "}
          <a href="mailto:[email protected]" className="underline">[email protected]</a>.
        </p>

        <h2 className="text-xl font-semibold mt-10">6. AI-generated content</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>AI is not perfect.</strong> Generated images are visualisations only</li>
          <li><strong>No guarantees</strong> of accuracy, appropriateness, or fitness for any purpose</li>
          <li><strong>Use at your own discretion</strong> — see the product in person where possible</li>
          <li>
            <strong>Ownership of output.</strong> You may use AI-generated images for personal
            purposes. We make no warranty about third-party rights
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-10">7. Intellectual property</h2>
        <p>
          The Plumely website, brand, design, code, and Service are owned by us. You may not
          copy, modify, distribute, sell, or lease any part of the Service without our written
          permission. The &quot;Plumely&quot; name and logo are our trademarks.
        </p>

        <h2 className="text-xl font-semibold mt-10">8. Availability and changes</h2>
        <p>
          We do not guarantee that the Service will be available 24/7 or error-free. We may
          modify, suspend, or discontinue any part of the Service at any time, update these
          Terms, or change usage limits. We are not liable for any downtime or service
          interruption.
        </p>

        <h2 className="text-xl font-semibold mt-10">9. Disclaimer of warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT
          WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY SOUTH AFRICAN LAW, WE
          DISCLAIM ALL WARRANTIES, INCLUDING FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY,
          ACCURACY OR RELIABILITY OF AI-GENERATED CONTENT, NON-INFRINGEMENT, AND CONTINUOUS,
          UNINTERRUPTED, OR ERROR-FREE OPERATION. You use the Service at your own risk.
        </p>

        <h2 className="text-xl font-semibold mt-10">10. Limitation of liability</h2>
        <p>To the fullest extent permitted by South African law, Plumely shall not be liable for any:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Indirect, incidental, consequential, or special damages</li>
          <li>Loss of profits, revenue, data, or business opportunities</li>
          <li>Damages arising from your reliance on AI-generated images</li>
          <li>Damages arising from third-party content or services</li>
        </ul>
        <p>
          If we are held liable for any damages, our total liability is limited to{" "}
          <strong>ZAR 1,000</strong> or the amount you paid us in the 12 months before the claim,
          whichever is greater. This clause does not limit liability for fraud, gross negligence,
          or anything else that cannot be limited under South African law.
        </p>

        <h2 className="text-xl font-semibold mt-10">11. Indemnity</h2>
        <p>
          You agree to indemnify and hold Plumely harmless from any claims, damages, losses, or
          expenses (including reasonable legal fees) arising from your breach of these Terms,
          your misuse of the Service, or content you upload that infringes any third-party rights
          or violates any law.
        </p>

        <h2 className="text-xl font-semibold mt-10">12. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, without notice, if
          we believe you have breached these Terms. You may stop using the Service at any time.
        </p>

        <h2 className="text-xl font-semibold mt-10">13. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of the <strong>Republic of South Africa</strong>.
          Any dispute shall be subject to the exclusive jurisdiction of the South African courts.
          Before taking legal action, we both agree to attempt to resolve the dispute in good
          faith by contacting us at{" "}
          <a href="mailto:[email protected]" className="underline">[email protected]</a>.
        </p>

        <h2 className="text-xl font-semibold mt-10">14. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. The &quot;Last updated&quot; date at the
          top will be revised. Continued use of the Service after changes means you accept the
          new Terms.
        </p>

        <h2 className="text-xl font-semibold mt-10">15. Severability</h2>
        <p>
          If any part of these Terms is found to be unenforceable, the rest of the Terms will
          remain in full effect.
        </p>

        <h2 className="text-xl font-semibold mt-10">16. Contact us</h2>
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