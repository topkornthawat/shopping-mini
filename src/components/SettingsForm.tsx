"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsForm({
  initialLineOaLink,
}: {
  initialLineOaLink: string;
}) {
  const router = useRouter();
  const [link, setLink] = useState(initialLineOaLink);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaved(false);

    const trimmed = link.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      setError("ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("settings")
      .update({ value: trimmed })
      .eq("key", "line_oa_link");
    setSaving(false);

    if (upErr) {
      setError("บันทึกไม่สำเร็จ: " + upErr.message);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <div className="card p-5">
        <p className="mb-1 font-semibold">💬 ลิงก์ Line OA สำหรับชำระเงิน</p>
        <p className="mb-3 text-sm text-muted">
          ลิงก์นี้จะแสดงให้ลูกค้าหลังยืนยันคำสั่งซื้อ
          เพื่อให้ลูกค้าติดต่อชำระเงินผ่าน Line
        </p>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://lin.ee/xxxxxxx"
          className="w-full p-2 text-sm"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">
            บันทึกเรียบร้อยแล้ว ✓
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-4 px-5 py-2.5"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
