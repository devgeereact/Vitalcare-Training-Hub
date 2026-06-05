-- 059_redeem_coupon.sql
-- Coupons have a max_uses cap, but order creation never incremented used_count
-- (and buyers cannot update the coupons table under RLS), so the cap was never
-- enforced. This SECURITY DEFINER function increments the count atomically,
-- only while the coupon is active and under its cap.

create or replace function public.redeem_coupon(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set used_count = coalesce(used_count, 0) + 1
  where code = upper(trim(p_code))
    and is_active = true
    and (max_uses is null or used_count < max_uses);
end;
$$;

revoke all on function public.redeem_coupon(text) from public;
grant execute on function public.redeem_coupon(text) to authenticated;
