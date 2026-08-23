"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABEL_TH, type OrderStatus } from "@/lib/types";

const OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "shipping",
  "completed",
  "cancelled",
];

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(status);

  async function handleChange(newStatus: OrderStatus) {
    setBusy(true);
    setCurrent(newStatus);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    if (!res.ok) {
      setCurrent(status);
      alert("อัปเดตสถานะไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={current}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="p-1.5 text-sm"
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL_TH[s]}
        </option>
      ))}
    </select>
  );
}
