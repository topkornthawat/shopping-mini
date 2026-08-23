export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  image_url: string;
  unit_price: number;
  active: boolean;
  sort_order: number;
};

export type PromotionTier = {
  id: string;
  product_id: string;
  min_qty: number;
  max_qty: number | null;
  discount_percent: number;
};

export type CartPromotion = {
  id: string;
  min_subtotal: number;
  discount_amount: number;
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipping"
  | "completed"
  | "cancelled";

export const STATUS_LABEL_TH: Record<OrderStatus, string> = {
  pending_payment: "รอชำระเงิน",
  paid: "ชำระเงินแล้ว",
  shipping: "กำลังจัดส่ง",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800 border-amber-300",
  paid: "bg-blue-100 text-blue-800 border-blue-300",
  shipping: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

export type Order = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_count: number;
  subtotal: number;
  discount_total: number;
  net_total: number;
  status: OrderStatus;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
};

export type CartLine = {
  product_id: string;
  name: string;
  image_url: string;
  unit_price: number;
  qty: number;
};
