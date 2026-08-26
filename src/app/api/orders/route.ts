import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/require-user";
import { calcLine, findDiscountPercent, findCartPromoDiscount } from "@/lib/discount";
import type { Product, PromotionTier, CartPromotion } from "@/lib/types";

type IncomingItem = { product_id: string; qty: number };

export async function POST(req: Request) {
  try {
    const authUser = await requireUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนสั่งซื้อ" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { customer_name, customer_phone, customer_address, items } =
      body as {
        customer_name: string;
        customer_phone: string;
        customer_address: string;
        items: IncomingItem[];
      };

    if (
      !customer_name?.trim() ||
      !customer_phone?.trim() ||
      !customer_address?.trim()
    ) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่ให้ครบถ้วน" },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีสินค้าในตะกร้า" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const productIds = items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("active", true);
    if (pErr) throw pErr;

    const productMap = new Map<string, Product>(
      (products ?? []).map((p: Product) => [p.id, p])
    );

    const { data: allTiers, error: tErr } = await supabase
      .from("promotion_tiers")
      .select("*")
      .in("product_id", productIds);
    if (tErr) throw tErr;

    const tiersByProduct = new Map<string, PromotionTier[]>();
    (allTiers ?? []).forEach((t: PromotionTier) => {
      const arr = tiersByProduct.get(t.product_id) ?? [];
      arr.push(t);
      tiersByProduct.set(t.product_id, arr);
    });

    let subtotal = 0;
    let discountTotal = 0;
    let itemCount = 0;
    const orderItemsPayload: {
      product_id: string;
      product_name: string;
      qty: number;
      unit_price: number;
      discount_percent: number;
      line_total: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `ไม่พบสินค้า (${item.product_id})` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.floor(item.qty));
      const tiers = tiersByProduct.get(product.id) ?? [];
      const discountPercent = findDiscountPercent(qty, tiers);
      const calc = calcLine(product.unit_price, qty, discountPercent);

      subtotal += calc.subtotal;
      discountTotal += calc.discountAmount;
      itemCount += qty;

      orderItemsPayload.push({
        product_id: product.id,
        product_name: product.name,
        qty,
        unit_price: product.unit_price,
        discount_percent: discountPercent,
        line_total: calc.lineTotal,
      });
    }

    const netTotal = subtotal - discountTotal;

    const { data: cartPromotions, error: cpErr } = await supabase
      .from("cart_promotions")
      .select("*");
    if (cpErr) throw cpErr;

    const cartPromoDiscount = findCartPromoDiscount(
      netTotal,
      (cartPromotions ?? []) as CartPromotion[]
    );

    discountTotal += cartPromoDiscount;
    const finalNetTotal = netTotal - cartPromoDiscount;

    const { data: orderNoData, error: rpcErr } = await supabase.rpc(
      "generate_order_no"
    );
    if (rpcErr) throw rpcErr;
    const orderNo = orderNoData as string;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        user_id: authUser.id,
        customer_name,
        customer_phone,
        customer_address: customer_address ?? "",
        item_count: itemCount,
        subtotal,
        discount_total: discountTotal,
        net_total: finalNetTotal,
        status: "pending_payment",
      })
      .select()
      .single();
    if (oErr) throw oErr;

    const { error: iErr } = await supabase.from("order_items").insert(
      orderItemsPayload.map((it) => ({ ...it, order_id: order.id }))
    );
    if (iErr) throw iErr;

    // Save/update the customer's profile with the latest shipping info so
    // future checkouts can be prefilled automatically.
    await supabase.from("profiles").upsert({
      id: authUser.id,
      name: customer_name,
      phone: customer_phone,
      address: customer_address ?? "",
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ order_no: order.order_no });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่" },
      { status: 500 }
    );
  }
}
