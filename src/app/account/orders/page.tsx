import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StoreHeader from "@/components/StoreHeader";
import { formatTHB } from "@/lib/discount";
import { STATUS_LABEL_TH, STATUS_COLOR } from "@/lib/types";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as Order[];

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold">ประวัติคำสั่งซื้อของฉัน</h1>
        <p className="mb-5 text-sm text-muted">{user?.email}</p>

        {list.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <p className="mb-4">ยังไม่มีคำสั่งซื้อ</p>
            <Link href="/" className="btn-primary inline-block px-6 py-2">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {list.map((o) => (
              <Link
                key={o.id}
                href={`/order/${o.order_no}`}
                className="block p-4 hover:bg-neutral-50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{o.order_no}</span>
                  <span className="font-semibold">
                    {formatTHB(o.net_total)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {new Date(o.created_at).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 font-medium ${STATUS_COLOR[o.status]}`}
                  >
                    {STATUS_LABEL_TH[o.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
