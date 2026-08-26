import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "line_oa_link")
    .single();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">ตั้งค่าระบบ</h1>
      <SettingsForm initialLineOaLink={data?.value ?? ""} />
    </div>
  );
}
