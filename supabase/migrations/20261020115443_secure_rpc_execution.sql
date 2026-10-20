-- Keep PostgREST-facing RPCs invoker functions. Move their guarded implementations
-- into the non-exposed private schema so the REST API has a narrow entry point.
alter function public.place_cod_order(jsonb, jsonb) set schema private;
alter function public.get_guest_order(text, text) set schema private;
alter function public.set_order_status(uuid, text) set schema private;

revoke all on function private.place_cod_order(jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function private.get_guest_order(text, text) from public, anon, authenticated, service_role;
revoke all on function private.set_order_status(uuid, text) from public, anon, authenticated, service_role;
grant execute on function private.place_cod_order(jsonb, jsonb) to anon, authenticated;
grant execute on function private.get_guest_order(text, text) to anon, authenticated;
grant execute on function private.set_order_status(uuid, text) to authenticated;

create or replace function public.place_cod_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.place_cod_order(p_customer, p_items);
end;
$$;

create or replace function public.get_guest_order(p_order_number text, p_token text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.get_guest_order(p_order_number, p_token);
end;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.set_order_status(p_order_id, p_status);
end;
$$;

revoke all on function public.place_cod_order(jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.get_guest_order(text, text) from public, anon, authenticated, service_role;
revoke all on function public.set_order_status(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.place_cod_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_guest_order(text, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- Profile edits use the customer's own-row RLS policy and column-level grants.
drop policy if exists "Customers update their profile" on public.profiles;
create policy "Customers update their profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
grant update (full_name, phone) on public.profiles to authenticated;
alter function public.update_customer_profile(text, text) security invoker;
revoke all on function public.update_customer_profile(text, text) from public, anon, authenticated, service_role;
grant execute on function public.update_customer_profile(text, text) to authenticated;
