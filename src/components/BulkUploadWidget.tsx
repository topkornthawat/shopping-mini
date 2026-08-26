"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkUploadWidget() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel ก่อน");
      return;
    }
    setError("");
    setResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      setResult(data);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card p-4">
      <p className="mb-2 font-semibold">📤 นำเข้าสินค้าจากไฟล์ Excel</p>
      <p className="mb-3 text-sm text-muted">
        อัปโหลดไฟล์ .xlsx ตามแบบฟอร์ม ระบบจะเพิ่มสินค้าใหม่
        หรืออัปเดตสินค้าเดิม (อ้างอิงจากรหัสสินค้า)
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/products/template"
          className="btn-outline px-4 py-2 text-sm"
        >
          ดาวน์โหลดแบบฟอร์ม
        </a>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary px-4 py-2 text-sm"
        >
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <p>
            นำเข้าสำเร็จ {result.imported} รายการ
            {result.skipped > 0 && ` (ข้าม ${result.skipped} รายการ)`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-red-700">
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
