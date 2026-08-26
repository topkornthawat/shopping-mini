import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies the current request comes from a logged-in Supabase Auth user
 * whose email exists in the `admins` allow-list table.
 * Returns the user's email on success, or null if not authorized.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  return data ? user.email : null;
}
