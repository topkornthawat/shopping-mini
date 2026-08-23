"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/products", label: "สินค้า" },
  { href: "/admin/promotions", label: "โปรโมชัน" },
  { href: "/admin/orders", label: "คำสั่งซื้อ" },
  { href: "/admin/settings", label: "ตั้งค่า" },
];

export default function AdminChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-brand-dark text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-bold">⚙️ ระบบจัดการร้านค้า</span>
          <button
            onClick={handleLogout}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
          >
            ออกจากระบบ
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 ${
                pathname === n.href
                  ? "bg-accent text-foreground font-semibold"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
