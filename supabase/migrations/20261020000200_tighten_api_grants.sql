-- Restrict RPC calls to the roles that actually need them.
-- Supabase default function privileges grant EXECUTE directly to anon and authenticated,
-- so revoking only from PUBLIC is not enough.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.update_customer_profile(text, text) from public, anon, authenticated;
revoke all on function public.place_cod_order(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.get_guest_order(text, text) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text) from public, anon, authenticated;

grant execute on function public.update_customer_profile(text, text) to authenticated;
grant execute on function public.place_cod_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_guest_order(text, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- A single product SELECT policy avoids repeating checks for signed-in admins.
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Admins insert products" on public.products;
create policy "Admins insert products" on public.products
for insert to authenticated
with check ((select private.is_store_admin()));
drop policy if exists "Admins update products" on public.products;
create policy "Admins update products" on public.products
for update to authenticated
using ((select private.is_store_admin()))
with check ((select private.is_store_admin()));
drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products" on public.products
for delete to authenticated
using ((select private.is_store_admin()));

-- Keep product-image reads public and limit writes to authenticated admins.
drop policy if exists "Admins manage product images" on storage.objects;
drop policy if exists "Admins insert product images" on storage.objects;
create policy "Admins insert product images" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_store_admin()));
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and (select private.is_store_admin()))
with check (bucket_id = 'product-images' and (select private.is_store_admin()));
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_store_admin()));
