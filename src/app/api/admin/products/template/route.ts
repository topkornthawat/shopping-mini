import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const headers = [
    "sku",
    "name",
    "description",
    "image_url",
    "unit_price",
    "active",
  ];
  const sample = [
    "SKU001",
    "ตัวอย่างสินค้า",
    "รายละเอียดสินค้าโดยย่อ",
    "https://example.com/image.jpg",
    "199.00",
    "TRUE",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "products");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="product_template.xlsx"',
    },
  });
}
