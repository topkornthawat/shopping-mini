"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTHB } from "@/lib/discount";
import type { Product } from "@/lib/types";

export default function ProductAdminRow({ product }: { product: Product }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`ลบสินค้า "${product.name}" ใช่หรือไม่?`)) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", product.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-muted">{product.sku}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-sm">{formatTHB(product.unit_price)}</td>
      <td className="p-3">
        <button
          onClick={toggleActive}
          disabled={busy}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            product.active
              ? "bg-emerald-100 text-emerald-800"
              : "bg-neutral-200 text-neutral-600"
          }`}
        >
          {product.active ? "เปิดขาย" : "ปิดขาย"}
        </button>
      </td>
      <td className="space-x-3 p-3 text-right text-sm">
        <Link href={`/admin/products/${product.id}`} className="text-brand underline">
          แก้ไข
        </Link>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-red-600 underline"
        >
          ลบ
        </button>
      </td>
    </tr>
  );
}
