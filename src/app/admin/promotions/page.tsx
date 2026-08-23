import { createClient } from "@/lib/supabase/server";
import PromotionsForm from "@/components/PromotionsForm";
import type { CartPromotion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_promotions")
    .select("*")
    .order("min_subtotal", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">โปรโมชันยอดสั่งซื้อ</h1>
      <p className="mb-5 text-sm text-muted">
        ส่วนลดนี้คำนวณจากยอดสั่งซื้อทั้งหมด (หลังหักส่วนลดสินค้า)
        ระบบจะใช้เงื่อนไขที่ให้ส่วนลดสูงสุดที่ลูกค้าเข้าเงื่อนไข
        (ไม่รวมกันหลายเงื่อนไข)
      </p>
      <PromotionsForm initialPromotions={(data ?? []) as CartPromotion[]} />
    </div>
  );
}
