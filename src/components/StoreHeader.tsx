"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function StoreHeader() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-20 bg-brand text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🛒 ร้านค้าออนไลน์
        </Link>
        <Link
          href="/cart"
          className="relative flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
        >
          ตะกร้าสินค้า
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-foreground">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
