import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_payment");

  const { count: totalOrderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">ภาพรวมร้านค้า</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="สินค้าทั้งหมด" value={productCount ?? 0} href="/admin/products" />
        <StatCard
          label="รอชำระเงิน"
          value={pendingCount ?? 0}
          href="/admin/orders"
          highlight
        />
        <StatCard label="คำสั่งซื้อทั้งหมด" value={totalOrderCount ?? 0} href="/admin/orders" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/products" className="btn-primary px-5 py-2.5">
          จัดการสินค้า
        </Link>
        <Link href="/admin/orders" className="btn-outline px-5 py-2.5">
          จัดการคำสั่งซื้อ
        </Link>
        <Link href="/admin/settings" className="btn-outline px-5 py-2.5">
          ตั้งค่าลิงก์ Line OA
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card block p-5 hover:shadow-md ${
        highlight ? "border-accent" : ""
      }`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand">{value}</p>
    </Link>
  );
}
