import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <StudioClient userEmail={user.email ?? ""} />;
}
