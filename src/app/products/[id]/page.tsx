import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeader from "@/components/StoreHeader";
import ProductDetailView from "@/components/ProductDetailView";
import type { Product, PromotionTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <ProductDetailView
          product={product as Product}
          tiers={(tiers ?? []) as PromotionTier[]}
        />
      </main>
    </div>
  );
}
