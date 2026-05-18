import { createClient } from "@supabase/supabase-js";
import ws from "ws";

/**
 * Service-role client. Server-only. Bypasses RLS — never import in client code.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        transport: ws as unknown as typeof WebSocket,
      },
    },
  );
}