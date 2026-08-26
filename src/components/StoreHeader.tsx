"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function StoreHeader() {
  const { totalItems } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-brand text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🛒 ร้านค้าออนไลน์
        </Link>
        <div className="flex items-center gap-3">
          {loaded && (
            <div className="hidden items-center gap-3 text-sm sm:flex">
              {email ? (
                <>
                  <Link href="/account/orders" className="underline hover:no-underline">
                    ประวัติคำสั่งซื้อ
                  </Link>
                  <button onClick={handleLogout} className="underline hover:no-underline">
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link href="/login" className="underline hover:no-underline">
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          )}
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
      </div>
      {loaded && (
        <div className="flex justify-end gap-3 px-4 pb-2 text-xs sm:hidden">
          {email ? (
            <>
              <Link href="/account/orders" className="underline">
                ประวัติคำสั่งซื้อ
              </Link>
              <button onClick={handleLogout} className="underline">
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link href="/login" className="underline">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
