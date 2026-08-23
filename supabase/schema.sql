-- ============================================================
-- Shop System schema for Supabase (Postgres)
-- Run this in Supabase SQL editor (or via CLI migration)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Admin allow-list
--   Any authenticated Supabase Auth user whose email is present
--   in this table is treated as an admin.
-- ------------------------------------------------------------
create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Products
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  name text not null,
  description text default '',
  image_url text default '',
  unit_price numeric(12,2) not null default 0,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Promotion tiers (quantity-based discount %)
--    Multiple rows per product = multiple conditions.
--    e.g. min_qty=5, max_qty=9,  discount_percent=5
--         min_qty=10, max_qty=null, discount_percent=10
-- ------------------------------------------------------------
create table if not exists promotion_tiers (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  min_qty int not null,
  max_qty int, -- null = ไม่จำกัด (no upper bound)
  discount_percent numeric(5,2) not null check (discount_percent >= 0 and discount_percent <= 100),
  created_at timestamptz not null default now()
);
create index if not exists idx_promo_product on promotion_tiers(product_id);

-- ------------------------------------------------------------
-- 3.1 Cart-level promotions (order subtotal threshold discounts)
--    e.g. min_subtotal=100, discount_amount=10
--         min_subtotal=500, discount_amount=100
--    Applies on top of per-product tiers. Best (highest) match wins.
-- ------------------------------------------------------------
create table if not exists cart_promotions (
  id uuid primary key default uuid_generate_v4(),
  min_subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. Settings (key/value) - stores Line OA link etc.
-- ------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value text not null default ''
);
insert into settings (key, value) values ('line_oa_link', '')
  on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 5. Orders
-- ------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_no text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null default '',
  item_count int not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  net_total numeric(12,2) not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','shipping','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. Order items
-- ------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  qty int not null,
  unit_price numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,
  line_total numeric(12,2) not null
);
create index if not exists idx_items_order on order_items(order_id);

-- ------------------------------------------------------------
-- Order number generator: ORD-YYYYMMDD-#### (daily incrementing)
-- ------------------------------------------------------------
create sequence if not exists order_no_seq;

create or replace function generate_order_no() returns text as $$
declare
  seq_val int;
  today_str text;
begin
  seq_val := nextval('order_no_seq');
  today_str := to_char(now(), 'YYYYMMDD');
  return 'ORD-' || today_str || '-' || lpad((seq_val % 10000)::text, 4, '0');
end;
$$ language plpgsql;

-- keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table products enable row level security;
alter table promotion_tiers enable row level security;
alter table cart_promotions enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table admins enable row level security;

-- Helper: is the current auth user an admin?
-- SECURITY DEFINER so this bypasses RLS on `admins` itself (avoids recursive policy checks)
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from admins where email = (auth.jwt() ->> 'email')
  );
$$ language sql stable security definer set search_path = public;

-- Public (anon) can READ active products & their promo tiers & settings
create policy "public read active products" on products
  for select using (active = true or is_admin());

create policy "public read promo tiers" on promotion_tiers
  for select using (true);

create policy "public read cart promotions" on cart_promotions
  for select using (true);

create policy "public read settings" on settings
  for select using (true);

-- Admin-only write access
create policy "admin write products" on products
  for all using (is_admin()) with check (is_admin());

create policy "admin write promo tiers" on promotion_tiers
  for all using (is_admin()) with check (is_admin());

create policy "admin write cart promotions" on cart_promotions
  for all using (is_admin()) with check (is_admin());

create policy "admin write settings" on settings
  for all using (is_admin()) with check (is_admin());

create policy "admin read admins" on admins
  for select using (is_admin());

-- Orders: public (anon) can INSERT (create) their own order + items,
-- but cannot read/update/delete (that is done via server route using
-- the service role key). Admins can do everything.
create policy "public can create orders" on orders
  for insert with check (true);

create policy "admin manage orders" on orders
  for all using (is_admin()) with check (is_admin());

create policy "public can create order items" on order_items
  for insert with check (true);

create policy "admin manage order items" on order_items
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- Storage bucket for product images (run once)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "admin upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "admin update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================
-- Seed: add yourself as admin (replace email, run manually)
-- ============================================================
-- insert into admins (email) values ('you@example.com');
