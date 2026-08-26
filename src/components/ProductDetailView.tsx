"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatTHB, findDiscountPercent, calcLine } from "@/lib/discount";
import type { Product, PromotionTier } from "@/lib/types";

export default function ProductDetailView({
  product,
  tiers,
}: {
  product: Product;
  tiers: PromotionTier[];
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const discountPercent = findDiscountPercent(qty, tiers);
  const { lineTotal, discountAmount } = calcLine(
    product.unit_price,
    qty,
    discountPercent
  );

  function handleAdd() {
    addToCart(
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit_price: product.unit_price,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function handleBuyNow() {
    addToCart(
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit_price: product.unit_price,
      },
      qty
    );
    router.push("/cart");
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            ไม่มีรูปภาพ
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted">รหัสสินค้า: {product.sku}</p>
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {product.description || "ไม่มีรายละเอียดสินค้า"}
        </p>

        <p className="text-3xl font-bold text-brand">
          {formatTHB(product.unit_price)}
        </p>

        {tiers.length > 0 && (
          <div className="card p-4">
            <p className="mb-2 text-sm font-semibold">
              🎉 ส่วนลดตามจำนวนที่ซื้อ
            </p>
            <ul className="space-y-1 text-sm text-foreground/80">
              {tiers
                .slice()
                .sort((a, b) => a.min_qty - b.min_qty)
                .map((t) => (
                  <li key={t.id}>
                    ซื้อ {t.min_qty}
                    {t.max_qty ? `-${t.max_qty}` : " ชิ้นขึ้นไป"} ชิ้น ลด{" "}
                    {t.discount_percent}%
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">จำนวน</span>
          <div className="flex items-center rounded-xl border border-border">
            <button
              className="px-3 py-2 text-lg"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-14 border-0 text-center focus:outline-none"
            />
            <button
              className="px-3 py-2 text-lg"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        {discountPercent > 0 && (
          <p className="text-sm text-emerald-700">
            ได้รับส่วนลด {discountPercent}% (ลด {formatTHB(discountAmount)}) →
            รวม {formatTHB(lineTotal)}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button onClick={handleAdd} className="btn-outline flex-1 py-3">
            {added ? "เพิ่มแล้ว ✓" : "หยิบใส่ตะกร้า"}
          </button>
          <button onClick={handleBuyNow} className="btn-primary flex-1 py-3">
            ซื้อเลย
          </button>
        </div>
      </div>
    </div>
  );
}
