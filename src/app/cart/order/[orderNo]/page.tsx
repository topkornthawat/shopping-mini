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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="card p-6 text-center">
          <div className="mb-2 text-4xl">✅</div>
          <h1 className="text-xl font-bold">สั่งซื้อสำเร็จ</h1>
          <p className="mt-1 text-sm text-muted">
            บันทึกคำสั่งซื้อของคุณเรียบร้อยแล้ว
          </p>

          <div className="mt-5 rounded-xl bg-brand/5 p-4">
            <p className="text-sm text-muted">เลขที่คำสั่งซื้อ</p>
            <p className="text-2xl font-bold tracking-wide text-brand">
              {o.order_no}
            </p>
            <div className="mt-3">
              <CopyButton text={o.order_no} />
            </div>
          </div>

          <p className="mt-4 inline-block rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-sm text-amber-800">
            สถานะ: {STATUS_LABEL_TH[o.status]}
          </p>
        </div>

        <div className="card mt-4 divide-y divide-border">
          {(items as OrderItem[] | null)?.map((it) => (
            <div key={it.id} className="flex justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{it.product_name}</p>
                <p className="text-muted">
                  {it.qty} x {formatTHB(it.unit_price)}
                  {it.discount_percent > 0
                    ? ` (ลด ${it.discount_percent}%)`
                    : ""}
                </p>
              </div>
              <p className="font-semibold">{formatTHB(it.line_total)}</p>
            </div>
          ))}
        </div>

        <div className="card mt-4 space-y-2 p-4 text-sm">
          <Row label="จำนวนสินค้า" value={`${o.item_count} ชิ้น`} />
          <Row label="ยอดรวม" value={formatTHB(o.subtotal)} />
          <Row label="ส่วนลด" value={`- ${formatTHB(o.discount_total)}`} />
          <div className="border-t border-border pt-2">
            <Row label="ยอดสุทธิ" value={formatTHB(o.net_total)} bold />
          </div>
        </div>

        {lineOaLink && (
          <div className="card mt-4 p-5 text-center">
            <p className="mb-1 font-semibold">💬 ชำระเงินผ่าน Line OA</p>
            <p className="mb-3 text-sm text-muted">
              แจ้งเลขที่คำสั่งซื้อ{" "}
              <span className="font-semibold text-foreground">
                {o.order_no}
              </span>{" "}
              กับแอดมินเพื่อชำระเงิน
            </p>
            <a
              href={lineOaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent inline-block px-6 py-3"
            >
              เปิด Line OA เพื่อชำระเงิน
            </a>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
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
      className={`flex justify-between ${bold ? "text-lg font-bold text-brand" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
