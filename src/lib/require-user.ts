import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the current request comes from a logged-in Supabase Auth user
 * (any customer account, not just admins). Returns the user's id/email on
 * success, or null if not authenticated.
 */
export async function requireUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}
