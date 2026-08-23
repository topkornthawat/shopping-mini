import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Row = {
  sku?: string | number;
  name?: string;
  description?: string;
  image_url?: string;
  unit_price?: string | number;
  active?: string | boolean | number;
};

function parseActive(v: Row["active"]): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return ["true", "1", "yes", "y", "active", "จริง"].includes(s);
  }
  return true;
}

export async function POST(req: Request) {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์ Excel" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลในไฟล์" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const validRows: {
      sku: string;
      name: string;
      description: string;
      image_url: string;
      unit_price: number;
      active: boolean;
    }[] = [];

    rows.forEach((row, idx) => {
      const lineNo = idx + 2; // header is row 1
      const sku = String(row.sku ?? "").trim();
      const name = String(row.name ?? "").trim();
      const priceRaw = row.unit_price;
      const price =
        typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw));

      if (!sku) {
        errors.push(`แถวที่ ${lineNo}: ไม่มีรหัสสินค้า (sku)`);
        return;
      }
      if (!name) {
        errors.push(`แถวที่ ${lineNo}: ไม่มีชื่อสินค้า (name)`);
        return;
      }
      if (isNaN(price) || price < 0) {
        errors.push(`แถวที่ ${lineNo}: ราคาสินค้าไม่ถูกต้อง (unit_price)`);
        return;
      }

      validRows.push({
        sku,
        name,
        description: String(row.description ?? ""),
        image_url: String(row.image_url ?? ""),
        unit_price: price,
        active: parseActive(row.active),
      });
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีแถวที่ถูกต้อง", details: errors },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error, count } = await supabase
      .from("products")
      .upsert(validRows, { onConflict: "sku", count: "exact" });

    if (error) throw error;

    return NextResponse.json({
      imported: count ?? validRows.length,
      skipped: errors.length,
      errors,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "ไม่สามารถประมวลผลไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์" },
      { status: 500 }
    );
  }
}
