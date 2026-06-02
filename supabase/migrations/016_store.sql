-- ============================================================================
-- Vitalcare Training Hub — Store (Phase 11)
-- Products, orders, order items, coupons. Payment by bank transfer / PayPal
-- (no Stripe per project rules). is_staff() from 001_schema.sql.
-- ============================================================================

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  price_pence   integer not null default 0,
  course_id     uuid references public.courses (id) on delete set null,
  thumbnail_url text,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  percent_off     smallint check (percent_off between 1 and 100),
  amount_off_pence integer check (amount_off_pence >= 0),
  expires_at      timestamptz,
  max_uses        integer,
  used_count      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid references public.profiles (id) on delete set null,
  status         text not null default 'pending'
                 check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  total_pence    integer not null default 0,
  payment_method text not null default 'bank_transfer'
                 check (payment_method in ('bank_transfer', 'paypal')),
  coupon_code    text,
  reference      text,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz,
  confirmed_by   uuid references public.profiles (id) on delete set null
);
create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  quantity         integer not null default 1,
  unit_price_pence integer not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Products: published readable by all authenticated; staff manage.
drop policy if exists products_select on public.products;
create policy products_select on public.products for select
  using (is_published or public.is_staff());
drop policy if exists products_write on public.products;
create policy products_write on public.products for all
  using (public.is_staff()) with check (public.is_staff());

-- Coupons: authenticated read active (to apply at checkout); staff manage.
drop policy if exists coupons_select on public.coupons;
create policy coupons_select on public.coupons for select
  using (auth.uid() is not null);
drop policy if exists coupons_write on public.coupons;
create policy coupons_write on public.coupons for all
  using (public.is_staff()) with check (public.is_staff());

-- Orders: buyers see and create their own; staff see and update all.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select
  using (buyer_id = auth.uid() or public.is_staff());
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert
  with check (buyer_id = auth.uid());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update
  using (public.is_staff()) with check (public.is_staff());

-- Order items: visible/insertable with the parent order.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or public.is_staff())
    )
  );
drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );
