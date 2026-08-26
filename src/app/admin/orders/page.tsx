import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import { formatTHB } from "@/lib/discount";
import { STATUS_LABEL_TH, STATUS_COLOR, type Order, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending_payment", label: STATUS_LABEL_TH.pending_payment },
  { value: "paid", label: STATUS_LABEL_TH.paid },
  { value: "shipping", label: STATUS_LABEL_TH.shipping },
  { value: "completed", label: STATUS_LABEL_TH.completed },
  { value: "cancelled", label: STATUS_LABEL_TH.cancelled },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = (status as OrderStatus | undefined) ?? "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: orders } = await query;
  const list = (orders ?? []) as Order[];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">คำสั่งซื้อ</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              activeFilter === f.value
                ? "border-brand bg-brand text-white"
                : "border-border bg-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <p className="p-8 text-center text-muted">ไม่มีคำสั่งซื้อ</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-xs uppercase text-muted">
              <tr>
                <th className="p-3">เลขที่คำสั่งซื้อ</th>
                <th className="p-3">ลูกค้า</th>
                <th className="p-3">จำนวน</th>
                <th className="p-3">ยอดสุทธิ</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3">เปลี่ยนสถานะ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-sm font-medium">{o.order_no}</td>
                  <td className="p-3 text-sm">
                    <p>{o.customer_name}</p>
                    <p className="text-xs text-muted">{o.customer_phone}</p>
                  </td>
                  <td className="p-3 text-sm">{o.item_count}</td>
                  <td className="p-3 text-sm font-semibold">
                    {formatTHB(o.net_total)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[o.status]}`}
                    >
                      {STATUS_LABEL_TH[o.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
