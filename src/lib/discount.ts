import type { PromotionTier, CartPromotion } from "./types";

/**
 * Given a quantity and the product's promotion tiers, find the best
 * matching discount percent. Tiers are ranges [min_qty, max_qty] (max_qty
 * null = no upper bound). If multiple tiers match, the one with the
 * highest discount_percent wins.
 */
export function findDiscountPercent(
  qty: number,
  tiers: PromotionTier[]
): number {
  let best = 0;
  for (const t of tiers) {
    const withinMin = qty >= t.min_qty;
    const withinMax = t.max_qty == null || qty <= t.max_qty;
    if (withinMin && withinMax && t.discount_percent > best) {
      best = t.discount_percent;
    }
  }
  return best;
}

/**
 * Cart-level (order subtotal) threshold discount, e.g. spend >= 100 get 10
 * off, spend >= 500 get 100 off. Applied on the subtotal AFTER per-product
 * discounts. Only the single best (highest) matching tier applies - tiers
 * do not stack. Never returns more than the amount itself.
 */
export function findCartPromoDiscount(
  amountAfterItemDiscount: number,
  promotions: CartPromotion[]
): number {
  let best = 0;
  for (const p of promotions) {
    if (amountAfterItemDiscount >= p.min_subtotal && p.discount_amount > best) {
      best = p.discount_amount;
    }
  }
  return round2(Math.min(best, amountAfterItemDiscount));
}

/**
 * Returns the next cart promotion tier the customer hasn't reached yet
 * (the closest one above their current amount), or null if none remain.
 * Used to show a "spend X more to get Y off" nudge.
 */
export function nextCartPromoTier(
  amountAfterItemDiscount: number,
  promotions: CartPromotion[]
): CartPromotion | null {
  const upcoming = promotions
    .filter((p) => p.min_subtotal > amountAfterItemDiscount)
    .sort((a, b) => a.min_subtotal - b.min_subtotal);
  return upcoming[0] ?? null;
}

export function calcLine(
  unitPrice: number,
  qty: number,
  discountPercent: number
) {
  const subtotal = round2(unitPrice * qty);
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const lineTotal = round2(subtotal - discountAmount);
  return { subtotal, discountAmount, lineTotal };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(n);
}
