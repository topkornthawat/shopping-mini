import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import StoreHeader from "@/components/StoreHeader";
import CopyButton from "@/components/CopyButton";
import { formatTHB } from "@/lib/discount";
import { STATUS_LABEL_TH } from "@/lib/types";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", (order as Order).id);

  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "line_oa_link")
    .single();

  const lineOaLink = setting?.value || "";
  const o = order as Order;

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-md px-3 py-3">
        <div className="card p-3 text-center">
          <div className="text-2xl">✅</div>
          <h1 className="text-base font-bold">สั่งซื้อสำเร็จ</h1>

          <div className="mt-2 rounded-lg bg-brand/5 p-2.5">
            <p className="text-xs text-muted">เลขที่คำสั่งซื้อ</p>
            <p className="text-lg font-bold tracking-wide text-brand">
              {o.order_no}
            </p>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <CopyButton text={o.order_no} />
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs text-amber-800">
                {STATUS_LABEL_TH[o.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="card mt-2 max-h-32 divide-y divide-border overflow-y-auto">
          {(items as OrderItem[] | null)?.map((it) => (
            <div
              key={it.id}
              className="flex justify-between px-3 py-1.5 text-xs"
            >
              <span className="truncate pr-2">
                {it.product_name}{" "}
                <span className="text-muted">
                  x{it.qty}
                  {it.discount_percent > 0 ? ` (-${it.discount_percent}%)` : ""}
                </span>
              </span>
              <span className="whitespace-nowrap font-semibold">
                {formatTHB(it.line_total)}
              </span>
            </div>
          ))}
        </div>

        <div className="card mt-2 space-y-1 p-3 text-xs">
          <Row label="จำนวนสินค้า" value={`${o.item_count} ชิ้น`} />
          <Row label="ยอดรวม" value={formatTHB(o.subtotal)} />
          <Row label="ส่วนลด" value={`- ${formatTHB(o.discount_total)}`} />
          <div className="border-t border-border pt-1">
            <Row label="ยอดสุทธิ" value={formatTHB(o.net_total)} bold />
          </div>
        </div>

        {lineOaLink && (
          <div className="card mt-2 p-3 text-center">
            <p className="text-xs font-semibold">💬 ชำระเงินผ่าน Line OA</p>
            <p className="mb-2 text-xs text-muted">
              แจ้งเลขที่คำสั่งซื้อกับแอดมินเพื่อชำระเงิน
            </p>
            <a
              href={lineOaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent inline-block px-4 py-2 text-sm"
            >
              เปิด Line OA เพื่อชำระเงิน
            </a>
          </div>
        )}

        <div className="mt-2 text-center text-xs">
          <Link href="/" className="text-brand underline">
            กลับไปหน้าสินค้า
          </Link>
          {" · "}
          <Link href="/account/orders" className="text-brand underline">
            ดูประวัติคำสั่งซื้อ
          </Link>
        </div>
      </main>
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
      className={`flex justify-between ${bold ? "text-base font-bold text-brand" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
