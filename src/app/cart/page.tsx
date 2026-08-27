"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import {
  calcLine,
  findDiscountPercent,
  findCartPromoDiscount,
  nextCartPromoTier,
  formatTHB,
} from "@/lib/discount";
import type { PromotionTier, CartPromotion, Profile } from "@/lib/types";

export default function CartPage() {
  const { lines, updateQty, removeLine, clearCart } = useCart();
  const router = useRouter();
  const [tiersByProduct, setTiersByProduct] = useState<
    Record<string, PromotionTier[]>
  >({});
  const [cartPromotions, setCartPromotions] = useState<CartPromotion[]>([]);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setAuthChecked(true);
      if (data.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            const p = profile as Profile | null;
            if (p) {
              setForm({
                name: p.name || "",
                phone: p.phone || "",
                address: p.address || "",
              });
            }
          });
      }
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cart_promotions")
      .select("*")
      .then(({ data }) => setCartPromotions((data ?? []) as CartPromotion[]));
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    const supabase = createClient();
    supabase
      .from("promotion_tiers")
      .select("*")
      .in(
        "product_id",
        lines.map((l) => l.product_id)
      )
      .then(({ data }) => {
        const map: Record<string, PromotionTier[]> = {};
        (data ?? []).forEach((t: PromotionTier) => {
          map[t.product_id] = map[t.product_id] || [];
          map[t.product_id].push(t);
        });
        setTiersByProduct(map);
      });
  }, [lines]);

  const summary = useMemo(() => {
    const rows = lines.map((l) => {
      const tiers = tiersByProduct[l.product_id] ?? [];
      const discountPercent = findDiscountPercent(l.qty, tiers);
      const calc = calcLine(l.unit_price, l.qty, discountPercent);
      return { ...l, discountPercent, ...calc };
    });
    const totals = rows.reduce(
      (acc, r) => ({
        subtotal: acc.subtotal + r.subtotal,
        itemDiscountTotal: acc.itemDiscountTotal + r.discountAmount,
      }),
      { subtotal: 0, itemDiscountTotal: 0 }
    );
    const afterItemDiscount = totals.subtotal - totals.itemDiscountTotal;
    const promoDiscount = findCartPromoDiscount(
      afterItemDiscount,
      cartPromotions
    );
    const nextTier = nextCartPromoTier(afterItemDiscount, cartPromotions);
    return {
      rows,
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      promoDiscount,
      discountTotal: totals.itemDiscountTotal + promoDiscount,
      netTotal: afterItemDiscount - promoDiscount,
      nextTier,
      amountAfterItemDiscount: afterItemDiscount,
    };
  }, [lines, tiersByProduct, cartPromotions]);

  const totalItems = lines.reduce((sum, l) => sum + l.qty, 0);

  async function handleConfirm() {
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่ให้ครบถ้วน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_address: form.address,
          items: lines.map((l) => ({
            product_id: l.product_id,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?next=/cart");
          return;
        }
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }
      clearCart();
      router.push(`/order/${data.order_no}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {step === "checkout" && lines.length > 0 && (
          <button
            onClick={() => setStep("cart")}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-brand"
          >
            ← กลับไปตะกร้า
          </button>
        )}
        {step === "cart" && lines.length > 0 && (
          <Link
            href="/"
            className="mb-3 flex items-center gap-1 text-sm font-medium text-brand"
          >
            ← กลับหน้าร้าน
          </Link>
        )}

        <h1 className="mb-5 text-2xl font-bold">
          {step === "cart" ? "ตะกร้าสินค้า" : "ข้อมูลผู้สั่งซื้อ"}
        </h1>

        {lines.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <p className="mb-4">ยังไม่มีสินค้าในตะกร้า</p>
            <Link href="/" className="btn-primary inline-block px-6 py-2">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="card divide-y divide-border">
              {summary.rows.map((row) => (
                <div key={row.product_id} className="flex gap-3 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {row.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.image_url}
                        alt={row.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted">
                      {formatTHB(row.unit_price)} / ชิ้น
                      {row.discountPercent > 0 && (
                        <span className="ml-2 text-emerald-700">
                          ลด {row.discountPercent}%
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            updateQty(row.product_id, row.qty - 1)
                          }
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">
                          {row.qty}
                        </span>
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            updateQty(row.product_id, row.qty + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeLine(row.product_id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-nowrap font-semibold">
                    {formatTHB(row.lineTotal)}
                  </p>
                </div>
              ))}
            </div>

            <PromoHint nextTier={summary.nextTier} />

            <SummaryBox
              totalItems={totalItems}
              subtotal={summary.subtotal}
              itemDiscountTotal={summary.itemDiscountTotal}
              promoDiscount={summary.promoDiscount}
              netTotal={summary.netTotal}
            />

            <button
              onClick={() =>
                userEmail
                  ? setStep("checkout")
                  : router.push("/login?next=/cart")
              }
              disabled={!authChecked}
              className="btn-primary mt-4 w-full py-3"
            >
              {authChecked
                ? userEmail
                  ? "ดำเนินการสั่งซื้อ"
                  : "เข้าสู่ระบบเพื่อสั่งซื้อ"
                : "..."}
            </button>
          </>
        ) : (
          <>
            <div className="card space-y-3 p-4">
              <Field
                label="ชื่อ-นามสกุล *"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="เช่น สมชาย ใจดี"
              />
              <Field
                label="เบอร์โทรศัพท์ *"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="เช่น 0812345678"
              />
              <div>
                <label className="mb-1 block text-sm font-medium">
                  ที่อยู่จัดส่ง *
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  rows={3}
                  className="w-full p-2 text-sm"
                  placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                />
              </div>
            </div>

            <PromoHint nextTier={summary.nextTier} />

            <SummaryBox
              totalItems={totalItems}
              subtotal={summary.subtotal}
              itemDiscountTotal={summary.itemDiscountTotal}
              promoDiscount={summary.promoDiscount}
              netTotal={summary.netTotal}
            />

            <p className="mt-2 text-center text-xs text-muted">
              สินค้าใช้เวลาจัดเตรียม 2-3 วัน
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setStep("cart")}
                className="btn-outline flex-1 py-3"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-primary flex-1 py-3"
              >
                {submitting ? "กำลังบันทึก..." : "ยืนยันคำสั่งซื้อ"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PromoHint({ nextTier }: { nextTier: CartPromotion | null }) {
  if (!nextTier) return null;
  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      🎁 ซื้อครบ{" "}
      <span className="font-semibold">
        {formatTHB(nextTier.min_subtotal)}
      </span>{" "}
      รับส่วนลด {formatTHB(nextTier.discount_amount)}
    </div>
  );
}

function SummaryBox({
  totalItems,
  subtotal,
  itemDiscountTotal,
  promoDiscount,
  netTotal,
}: {
  totalItems: number;
  subtotal: number;
  itemDiscountTotal: number;
  promoDiscount: number;
  netTotal: number;
}) {
  return (
    <div className="card mt-4 space-y-2 p-4 text-sm">
      <Row label="จำนวนสินค้า" value={`${totalItems} ชิ้น`} />
      <Row label="ยอดรวม" value={formatTHB(subtotal)} />
      <Row label="ส่วนลดสินค้า" value={`- ${formatTHB(itemDiscountTotal)}`} />
      {promoDiscount > 0 && (
        <Row
          label="ส่วนลดโปรโมชัน 🎁"
          value={`- ${formatTHB(promoDiscount)}`}
        />
      )}
      <div className="border-t border-border pt-2">
        <Row label="ยอดสุทธิ" value={formatTHB(netTotal)} bold />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "text-lg font-bold text-brand" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 text-sm"
      />
    </div>
  );
}
