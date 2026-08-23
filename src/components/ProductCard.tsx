"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatTHB } from "@/lib/discount";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit_price: product.unit_price,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-square w-full overflow-hidden bg-neutral-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              ไม่มีรูปภาพ
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 font-medium">{product.name}</h3>
        </Link>
        <p className="mt-auto text-lg font-bold text-brand">
          {formatTHB(product.unit_price)}
        </p>
        <button
          onClick={handleAdd}
          className="btn-primary mt-1 w-full py-2 text-sm"
        >
          {added ? "เพิ่มแล้ว ✓" : "หยิบใส่ตะกร้า"}
        </button>
      </div>
    </div>
  );
}
