import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";
import type { Product, PromotionTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  if (isNew) {
    return (
      <div>
        <h1 className="mb-5 text-2xl font-bold">เพิ่มสินค้าใหม่</h1>
        <ProductForm product={null} tiers={[]} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: tiers } = await supabase
    .from("promotion_tiers")
    .select("*")
    .eq("product_id", id);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">แก้ไขสินค้า</h1>
      <ProductForm
        product={product as Product}
        tiers={(tiers ?? []) as PromotionTier[]}
      />
    </div>
  );
}
