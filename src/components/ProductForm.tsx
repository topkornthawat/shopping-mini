"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product, PromotionTier } from "@/lib/types";

type TierDraft = {
  id: string;
  min_qty: string;
  max_qty: string;
  discount_percent: string;
};

export default function ProductForm({
  product,
  tiers,
}: {
  product: Product | null;
  tiers: PromotionTier[];
}) {
  const router = useRouter();
  const isNew = !product;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    image_url: product?.image_url ?? "",
    unit_price: product?.unit_price?.toString() ?? "",
    active: product?.active ?? true,
  });
  const [tierDrafts, setTierDrafts] = useState<TierDraft[]>(
    tiers.length > 0
      ? tiers.map((t) => ({
          id: t.id,
          min_qty: String(t.min_qty),
          max_qty: t.max_qty != null ? String(t.max_qty) : "",
          discount_percent: String(t.discount_percent),
        }))
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addTier() {
    setTierDrafts((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        min_qty: "",
        max_qty: "",
        discount_percent: "",
      },
    ]);
  }

  function updateTier(id: string, field: keyof TierDraft, value: string) {
    setTierDrafts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function removeTier(id: string) {
    setTierDrafts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setError("อัปโหลดรูปภาพไม่สำเร็จ: " + upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave() {
    setError("");
    if (!form.sku.trim() || !form.name.trim()) {
      setError("กรุณากรอกรหัสสินค้าและชื่อสินค้า");
      return;
    }
    const price = parseFloat(form.unit_price);
    if (isNaN(price) || price < 0) {
      setError("กรุณากรอกราคาสินค้าให้ถูกต้อง");
      return;
    }
    for (const t of tierDrafts) {
      if (!t.min_qty || !t.discount_percent) {
        setError("กรุณากรอกข้อมูลส่วนลดให้ครบทุกแถว");
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description,
      image_url: form.image_url,
      unit_price: price,
      active: form.active,
    };

    let productId = product?.id;
    if (isNew) {
      const { data, error: insErr } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (insErr) {
        setError("บันทึกไม่สำเร็จ: " + insErr.message);
        setSaving(false);
        return;
      }
      productId = data.id;
    } else {
      const { error: updErr } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId);
      if (updErr) {
        setError("บันทึกไม่สำเร็จ: " + updErr.message);
        setSaving(false);
        return;
      }
    }

    // replace promotion tiers wholesale (simple & predictable)
    await supabase.from("promotion_tiers").delete().eq("product_id", productId);
    const tiersToInsert = tierDrafts.map((t) => ({
      product_id: productId,
      min_qty: parseInt(t.min_qty),
      max_qty: t.max_qty ? parseInt(t.max_qty) : null,
      discount_percent: parseFloat(t.discount_percent),
    }));
    if (tiersToInsert.length > 0) {
      const { error: tierErr } = await supabase
        .from("promotion_tiers")
        .insert(tiersToInsert);
      if (tierErr) {
        setError("บันทึกส่วนลดไม่สำเร็จ: " + tierErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`ลบสินค้า "${product.name}" ใช่หรือไม่?`)) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", product.id);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              รหัสสินค้า (SKU) *
            </label>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              className="w-full p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              ราคา (บาท) *
            </label>
            <input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit_price: e.target.value }))
              }
              className="w-full p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            ชื่อสินค้า *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            รายละเอียดสินค้า
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">รูปภาพสินค้า</label>
          <div className="flex items-center gap-3">
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
              className="text-sm"
            />
          </div>
          {uploading && (
            <p className="mt-1 text-xs text-muted">กำลังอัปโหลด...</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
          />
          เปิดขายสินค้านี้
        </label>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">🎉 ส่วนลดตามจำนวน (ไม่บังคับ)</p>
          <button onClick={addTier} className="btn-outline px-3 py-1 text-sm">
            + เพิ่มเงื่อนไข
          </button>
        </div>

        {tierDrafts.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีเงื่อนไขส่วนลด</p>
        ) : (
          <div className="space-y-2">
            {tierDrafts.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted">ซื้อตั้งแต่</span>
                <input
                  type="number"
                  min={1}
                  value={t.min_qty}
                  onChange={(e) =>
                    updateTier(t.id, "min_qty", e.target.value)
                  }
                  className="w-20 p-1.5 text-center"
                  placeholder="เช่น 5"
                />
                <span className="text-muted">ถึง</span>
                <input
                  type="number"
                  min={1}
                  value={t.max_qty}
                  onChange={(e) =>
                    updateTier(t.id, "max_qty", e.target.value)
                  }
                  className="w-20 p-1.5 text-center"
                  placeholder="ไม่จำกัด"
                />
                <span className="text-muted">ชิ้น ลด</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={t.discount_percent}
                  onChange={(e) =>
                    updateTier(t.id, "discount_percent", e.target.value)
                  }
                  className="w-16 p-1.5 text-center"
                  placeholder="%"
                />
                <span className="text-muted">%</span>
                <button
                  onClick={() => removeTier(t.id)}
                  className="ml-auto text-red-600"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="btn-primary flex-1 py-3"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
        </button>
        {!isNew && (
          <button onClick={handleDelete} className="btn-outline px-5 py-3 text-red-600">
            ลบสินค้า
          </button>
        )}
      </div>
    </div>
  );
}
