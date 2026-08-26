"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CartPromotion } from "@/lib/types";

type Draft = {
  id: string;
  min_subtotal: string;
  discount_amount: string;
};

export default function PromotionsForm({
  initialPromotions,
}: {
  initialPromotions: CartPromotion[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(
    initialPromotions.map((p) => ({
      id: p.id,
      min_subtotal: String(p.min_subtotal),
      discount_amount: String(p.discount_amount),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function addRow() {
    setDrafts((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, min_subtotal: "", discount_amount: "" },
    ]);
  }

  function updateRow(id: string, field: keyof Draft, value: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }

  function removeRow(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSave() {
    setError("");
    setSaved(false);
    for (const d of drafts) {
      if (d.min_subtotal === "" || d.discount_amount === "") {
        setError("กรุณากรอกข้อมูลให้ครบทุกแถว");
        return;
      }
      if (isNaN(parseFloat(d.min_subtotal)) || isNaN(parseFloat(d.discount_amount))) {
        setError("กรุณากรอกตัวเลขให้ถูกต้อง");
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    // Simplest predictable approach: replace all rows wholesale.
    const { error: delErr } = await supabase
      .from("cart_promotions")
      .delete()
      .not("id", "is", null);
    if (delErr) {
      setError("บันทึกไม่สำเร็จ: " + delErr.message);
      setSaving(false);
      return;
    }

    if (drafts.length > 0) {
      const { error: insErr } = await supabase.from("cart_promotions").insert(
        drafts.map((d) => ({
          min_subtotal: parseFloat(d.min_subtotal),
          discount_amount: parseFloat(d.discount_amount),
        }))
      );
      if (insErr) {
        setError("บันทึกไม่สำเร็จ: " + insErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">เงื่อนไขส่วนลด</p>
          <button onClick={addRow} className="btn-outline px-3 py-1 text-sm">
            + เพิ่มเงื่อนไข
          </button>
        </div>

        {drafts.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีเงื่อนไขโปรโมชัน</p>
        ) : (
          <div className="space-y-2">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted">ซื้อครบ</span>
                <input
                  type="number"
                  min={0}
                  value={d.min_subtotal}
                  onChange={(e) =>
                    updateRow(d.id, "min_subtotal", e.target.value)
                  }
                  className="w-24 p-1.5 text-center"
                  placeholder="เช่น 100"
                />
                <span className="text-muted">บาท ลด</span>
                <input
                  type="number"
                  min={0}
                  value={d.discount_amount}
                  onChange={(e) =>
                    updateRow(d.id, "discount_amount", e.target.value)
                  }
                  className="w-24 p-1.5 text-center"
                  placeholder="เช่น 10"
                />
                <span className="text-muted">บาท</span>
                <button
                  onClick={() => removeRow(d.id)}
                  className="ml-auto text-sm text-red-600"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}

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
          className="btn-primary mt-4 w-full py-2.5"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกโปรโมชัน"}
        </button>
      </div>
    </div>
  );
}
