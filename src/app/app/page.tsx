import { createSupabaseServerClient } from "@/lib/supabase/server";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No sign-in gate — customers land directly on the studio.
  // If the visitor isn't authenticated, the client signs them in
  // anonymously on mount so the existing API/RLS flow keeps working.
  return <StudioClient userEmail={user?.email ?? ""} />;
}
