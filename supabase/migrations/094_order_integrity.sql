-- 094_order_integrity.sql
--
-- Deploy: supabase db push
--
-- Ordering was assembled in the browser. Three consequences.
--
-- 1. The price was whatever the browser said. `orders_insert` only checked
--    that the buyer was the signed-in user, so any authenticated person could
--    post an order for a £495 course at £0, with a coupon code they invented,
--    and it would sit in the staff queue looking ordinary.
--
-- 2. The order and its items were two separate writes and the second one's
--    error was never read. A failed item insert still returned "order placed",
--    leaving an order that confirmation cannot enrol because it contains
--    nothing.
--
-- 3. The reference was generated from the clock in the browser and never shown
--    to the buyer, so a payment arrived quoting a name rather than an order.
--
-- `place_order` does the whole thing on the server in one transaction, prices
-- it from the products table, and returns the reference the buyer must quote.
--
-- Cancellation and refund also get a route. Staff could only ever move an
-- order forwards, so a cancelled booking stayed "pending payment" for ever.

-- ===========================================================================
-- 1. Human references, unique and sequential
-- ===========================================================================

create sequence if not exists public.order_reference_seq as bigint start with 1000;

create unique index if not exists orders_reference_idx
  on public.orders (reference)
  where reference is not null;

-- VC-2609-1000: year, month, then a number that does not repeat. A buyer reads
-- it over the telephone and a bank reference field holds it.
create or replace function public.next_order_reference()
returns text
language sql
volatile
as $$
  select 'VC-' || to_char(now() at time zone 'Europe/London', 'YYMM')
      || '-' || nextval('public.order_reference_seq')::text;
$$;

revoke all on function public.next_order_reference() from public;

-- ===========================================================================
-- 2. place_order: one transaction, server-side pricing
-- ===========================================================================

create or replace function public.place_order(
  p_product uuid,
  p_payment_method text,
  p_coupon text default null
)
returns table (
  order_id       uuid,
  reference      text,
  total_pence    integer,
  discount_pence integer,
  coupon_code    text
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid      uuid := auth.uid();
  v_product  public.products%rowtype;
  v_coupon   public.coupons%rowtype;
  v_discount integer := 0;
  v_code     text := null;
  v_total    integer;
  v_ref      text;
  v_order    uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if p_payment_method not in ('bank_transfer', 'paypal') then
    raise exception 'Unknown payment method: %', p_payment_method
      using errcode = '22023';
  end if;

  -- Price comes from the catalogue, never from the caller. An unpublished or
  -- withdrawn product cannot be bought at all.
  select * into v_product
  from public.products
  where id = p_product and deleted_at is null and is_published = true;
  if not found then
    raise exception 'That product is not available' using errcode = 'P0002';
  end if;

  v_total := v_product.price_pence;

  -- Discount is re-checked here even though the browser quoted one. Expiry and
  -- the usage cap are read under a row lock, so two people racing the last use
  -- of a coupon cannot both get it.
  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select * into v_coupon
    from public.coupons
    where code = upper(trim(p_coupon))
    for update;

    if found
       and v_coupon.is_active is true
       and (v_coupon.expires_at is null or v_coupon.expires_at > now())
       and (v_coupon.max_uses is null
            or coalesce(v_coupon.used_count, 0) < v_coupon.max_uses)
    then
      if v_coupon.percent_off is not null then
        v_discount := round((v_total::numeric * v_coupon.percent_off) / 100);
      elsif v_coupon.amount_off_pence is not null then
        v_discount := v_coupon.amount_off_pence;
      end if;
      v_discount := least(greatest(v_discount, 0), v_total);
      if v_discount > 0 then
        v_code := v_coupon.code;
        v_total := v_total - v_discount;
      end if;
    end if;
    -- A coupon that did not apply is not an error. The order proceeds at the
    -- honest price and the caller is told what was actually charged.
  end if;

  v_ref := public.next_order_reference();

  insert into public.orders
    (buyer_id, status, total_pence, payment_method, coupon_code, reference)
  values (v_uid, 'pending', v_total, p_payment_method, v_code, v_ref)
  returning id into v_order;

  -- Same statement block, so a failure here takes the order with it rather
  -- than leaving an order with nothing in it.
  insert into public.order_items
    (order_id, product_id, quantity, unit_price_pence)
  values (v_order, v_product.id, 1, v_product.price_pence);

  if v_code is not null then
    perform public.redeem_coupon_for_order(v_order);
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (v_uid, 'order.placed', 'order', v_order,
          jsonb_build_object('reference', v_ref, 'total_pence', v_total,
                             'coupon', v_code));

  return query
    select v_order, v_ref, v_total, v_discount, v_code;
end;
$$;

revoke all on function public.place_order(uuid, text, text) from public;
grant execute on function public.place_order(uuid, text, text) to authenticated;

-- Buyers now order through place_order. Leaving the direct insert open would
-- leave the price in the browser's hands, which is the defect being closed.
-- Staff keep it, so an assisted booking can still be entered by hand.
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert
  with check (private.is_staff());

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert
  with check (private.is_staff());

-- ===========================================================================
-- 3. confirm_order only confirms an order that is waiting for payment
-- ===========================================================================

-- The previous version refused an order that was already paid, but happily
-- confirmed one that had been cancelled or refunded, enrolling the buyer on a
-- course they are no longer paying for.
create or replace function public.confirm_order(p_order uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_order  public.orders%rowtype;
  v_course uuid;
begin
  if not private.is_staff() then
    raise exception 'Only staff may confirm an order'
      using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then
    return false;
  end if;

  -- Idempotent, and one-directional: only a pending order can be confirmed.
  if v_order.status <> 'pending' then
    return false;
  end if;

  update public.orders
  set status = 'paid', paid_at = now(), confirmed_by = auth.uid()
  where id = p_order;

  for v_course in
    select distinct pr.course_id
    from public.order_items oi
    join public.products pr on pr.id = oi.product_id
    where oi.order_id = p_order and pr.course_id is not null
  loop
    insert into public.enrollments (learner_id, course_id, status)
    values (v_order.buyer_id, v_course, 'not_started')
    on conflict do nothing;
  end loop;

  perform public.redeem_coupon_for_order(p_order);

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'order.confirmed', 'order', p_order,
          jsonb_build_object('reference', v_order.reference,
                             'total_pence', v_order.total_pence));
  return true;
end;
$$;

revoke execute on function public.confirm_order(uuid) from anon;
grant execute on function public.confirm_order(uuid) to authenticated;

-- ===========================================================================
-- 4. Cancellation and refund
-- ===========================================================================

-- Allowed moves, and no others:
--   pending -> cancelled     the booking fell through before payment
--   paid    -> refunded      the money went back
-- Confirmation stays with confirm_order, which also enrols.
create or replace function public.set_order_status(
  p_order uuid,
  p_status text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_order public.orders%rowtype;
begin
  if not private.is_staff() then
    raise exception 'Only staff may change an order' using errcode = '42501';
  end if;

  if p_status not in ('cancelled', 'refunded') then
    raise exception 'Use confirm_order to mark an order paid'
      using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then
    return false;
  end if;

  -- Already there: succeed quietly, so a repeated click is harmless.
  if v_order.status = p_status then
    return true;
  end if;

  if p_status = 'cancelled' and v_order.status <> 'pending' then
    raise exception 'Only an order awaiting payment can be cancelled'
      using errcode = '22023';
  end if;
  if p_status = 'refunded' and v_order.status <> 'paid' then
    raise exception 'Only a paid order can be refunded'
      using errcode = '22023';
  end if;

  update public.orders set status = p_status where id = p_order;

  -- A cancelled order never took the coupon use it reserved, so give it back.
  -- A refund leaves the use spent: the sale happened.
  if p_status = 'cancelled' and v_order.coupon_code is not null then
    with removed as (
      delete from public.coupon_redemptions cr
      using public.coupons c
      where cr.order_id = p_order and c.id = cr.coupon_id
      returning c.id
    )
    update public.coupons
    set used_count = greatest(coalesce(used_count, 0) - 1, 0)
    where id in (select id from removed);
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'order.' || p_status, 'order', p_order,
          jsonb_build_object('reference', v_order.reference,
                             'from', v_order.status,
                             'reason', p_reason));
  return true;
end;
$$;

revoke all on function public.set_order_status(uuid, text, text) from public;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;
