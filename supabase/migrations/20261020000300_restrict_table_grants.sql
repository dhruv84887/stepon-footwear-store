-- Supabase grants broad table privileges by default. Keep RLS as the row-level
-- boundary and remove unnecessary direct table operations as defense in depth.
alter default privileges for role postgres in schema public
revoke all on tables from anon, authenticated;

revoke all on table public.profiles, public.products, public.store_settings, public.orders, public.order_items
from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.products to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert, update, delete on public.products to authenticated;

-- Product photos are public to read; only signed-in users pass the admin RLS
-- policies for writes. Preserve service_role's storage permissions.
revoke all on table storage.objects from anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
