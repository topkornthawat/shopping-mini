"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable - ignore
    }
  }

  return (
    <button onClick={handleCopy} className="btn-outline px-4 py-2 text-sm">
      {copied ? "คัดลอกแล้ว ✓" : "คัดลอกเลขที่คำสั่งซื้อ"}
    </button>
  );
}
