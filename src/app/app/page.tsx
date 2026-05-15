import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

// No sign-in gate — customers land directly on the studio.
// The client signs them in anonymously on mount so the existing
// API/RLS flow keeps working.
export default function StudioPage() {
  return <StudioClient />;
}
