import { createClient } from "@/lib/supabase/server";
import StoreHeader from "@/components/StoreHeader";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold">สินค้าทั้งหมด</h1>
        <p className="mb-5 text-sm text-muted">
          เลือกสินค้าที่ต้องการ แล้วกด &ldquo;หยิบใส่ตะกร้า&rdquo;
        </p>

        {list.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            ยังไม่มีสินค้าในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
