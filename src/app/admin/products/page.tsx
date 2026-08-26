import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BulkUploadWidget from "@/components/BulkUploadWidget";
import ProductAdminRow from "@/components/ProductAdminRow";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
        <Link href="/admin/products/new" className="btn-primary px-4 py-2 text-sm">
          + เพิ่มสินค้า
        </Link>
      </div>

      <div className="mb-5">
        <BulkUploadWidget />
      </div>

      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <p className="p-8 text-center text-muted">ยังไม่มีสินค้า</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-xs uppercase text-muted">
              <tr>
                <th className="p-3">สินค้า</th>
                <th className="p-3">ราคา</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <ProductAdminRow key={p.id} product={p} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
