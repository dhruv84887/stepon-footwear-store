-- STEPON store foundation: catalog, customer profiles, COD orders, and admin access.
-- Run this migration in the Supabase SQL editor or with the Supabase CLI.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text not null default '';

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text not null default '',
  category text not null check (category in ('Sneakers', 'Boots', 'Slides', 'Sandals', 'Shoes')),
  audience text not null default 'Unisex' check (audience in ('Men', 'Women', 'Unisex')),
  price numeric(10, 2) not null check (price >= 0),
  compare_price numeric(10, 2) check (compare_price is null or compare_price >= price),
  sizes smallint[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  color text not null default 'Black',
  color_hex text not null default '#343832' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  image_url text not null default '',
  state text not null default 'Active' check (state in ('Active', 'Draft')),
  badge text not null default '',
  rating numeric(2, 1) not null default 0.0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  popularity integer not null default 50 check (popularity between 0 and 100),
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  store_name text not null default 'STEPON Footwear',
  store_email text not null default 'hello@stepon.store',
  free_delivery_threshold numeric(10, 2) not null default 2499 check (free_delivery_threshold >= 0),
  delivery_fee numeric(10, 2) not null default 99 check (delivery_fee >= 0),
  return_window_days integer not null default 7 check (return_window_days between 0 and 90),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.store_settings'::regclass and conname = 'store_settings_store_name_valid') then
    alter table public.store_settings add constraint store_settings_store_name_valid
      check (char_length(trim(store_name)) between 2 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.store_settings'::regclass and conname = 'store_settings_store_email_valid') then
    alter table public.store_settings add constraint store_settings_store_email_valid
      check (char_length(store_email) <= 254 and store_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  profile_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text not null default '',
  shipping_pincode text not null,
  payment_method text not null default 'COD' check (payment_method = 'COD'),
  status text not null default 'Confirmed' check (status in ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total = subtotal + shipping_fee),
  guest_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_sku text not null,
  product_name text not null,
  image_url text not null default '',
  color text not null default '',
  size smallint not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists products_storefront_idx on public.products (state, category, created_at desc);
create index if not exists orders_profile_created_idx on public.orders (profile_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated after update of email on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, phone, role)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', ''),
       nullif(raw_user_meta_data ->> 'phone', ''), 'customer'
from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Customers read their profile" on public.profiles;
create policy "Customers read their profile" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_store_admin());

drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products
for select to anon, authenticated
using (state = 'Active' or public.is_store_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated
using (public.is_store_admin())
with check (public.is_store_admin());

drop policy if exists "Public reads store settings" on public.store_settings;
create policy "Public reads store settings" on public.store_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins update store settings" on public.store_settings;
create policy "Admins update store settings" on public.store_settings
for update to authenticated
using (public.is_store_admin())
with check (public.is_store_admin());

drop policy if exists "Customers read their orders" on public.orders;
create policy "Customers read their orders" on public.orders
for select to authenticated
using (profile_id = (select auth.uid()) or public.is_store_admin());

drop policy if exists "Customers read their order items" on public.order_items;
create policy "Customers read their order items" on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.profile_id = (select auth.uid()) or public.is_store_admin())
  )
);

grant select on public.profiles, public.products to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert, update, delete on public.products to authenticated;

create or replace function public.update_customer_profile(p_full_name text, p_phone text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then
    raise exception 'NAME_REQUIRED' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_phone, '')), '') is not null
     and length(regexp_replace(trim(p_phone), '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;

  update public.profiles
  set full_name = trim(p_full_name), phone = nullif(trim(coalesce(p_phone, '')), '')
  where id = auth.uid()
  returning * into v_profile;
  return v_profile;
end;
$$;

create or replace function public.place_cod_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_name text;
  v_customer_email text;
  v_customer_phone text;
  v_address text;
  v_city text;
  v_state text;
  v_pincode text;
  v_lock record;
  v_requested integer;
  v_item jsonb;
  v_product public.products;
  v_size smallint;
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_shipping_fee numeric(10, 2);
  v_free_delivery_threshold numeric(10, 2);
  v_delivery_fee numeric(10, 2);
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'STP-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  v_guest_token text;
  v_items jsonb;
begin
  if p_customer is null or p_items is null or jsonb_typeof(p_customer) <> 'object' or jsonb_typeof(p_items) <> 'array'
  then
    raise exception 'INVALID_ORDER' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'INVALID_ORDER' using errcode = '22023';
  end if;

  v_customer_name := trim(coalesce(p_customer ->> 'name', ''));
  v_customer_email := lower(trim(coalesce(p_customer ->> 'email', '')));
  v_customer_phone := trim(coalesce(p_customer ->> 'phone', ''));
  v_address := trim(coalesce(p_customer ->> 'address', ''));
  v_city := trim(coalesce(p_customer ->> 'city', ''));
  v_state := trim(coalesce(p_customer ->> 'state', ''));
  v_pincode := trim(coalesce(p_customer ->> 'pincode', ''));

  if length(v_customer_name) not between 2 and 120
     or length(v_customer_email) > 254
     or v_customer_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(regexp_replace(v_customer_phone, '[^0-9]', '', 'g')) not between 10 and 15
     or length(v_address) not between 5 and 300
     or length(v_city) not between 2 and 100
     or length(v_state) > 100
     or v_pincode !~ '^[0-9]{6}$' then
    raise exception 'INVALID_CUSTOMER_DETAILS' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) i
    where coalesce(i ->> 'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(i ->> 'size', '') !~ '^[0-9]{1,2}$'
       or coalesce(i ->> 'quantity', '') !~ '^[0-9]{1,2}$'
  ) then
    raise exception 'INVALID_ORDER_ITEMS' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) i where (i ->> 'quantity')::integer < 1 or (i ->> 'quantity')::integer > 20) then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  -- Lock each distinct product in a deterministic order so concurrent checkouts cannot oversell stock.
  for v_lock in
    select distinct (i ->> 'product_id')::uuid as id
    from jsonb_array_elements(p_items) i
    order by id
  loop
    select * into v_product from public.products where id = v_lock.id for update;
    if not found or v_product.state <> 'Active' then
      raise exception 'PAIR_UNAVAILABLE' using errcode = 'P0001';
    end if;
    select sum((i ->> 'quantity')::integer)::integer into v_requested
    from jsonb_array_elements(p_items) i where (i ->> 'product_id')::uuid = v_lock.id;
    if v_product.stock < v_requested then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for update;
    if not found or v_product.state <> 'Active' then
      raise exception 'PAIR_UNAVAILABLE' using errcode = 'P0001';
    end if;
    v_size := (v_item ->> 'size')::smallint;
    v_quantity := (v_item ->> 'quantity')::integer;
    if not (v_size = any(v_product.sizes)) then
      raise exception 'SIZE_UNAVAILABLE' using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  select free_delivery_threshold, delivery_fee into v_free_delivery_threshold, v_delivery_fee
  from public.store_settings where id = 1;
  v_shipping_fee := case when v_subtotal >= coalesce(v_free_delivery_threshold, 2499) then 0 else coalesce(v_delivery_fee, 99) end;
  if auth.uid() is null then
    v_guest_token := encode(extensions.gen_random_bytes(32), 'hex');
  end if;

  insert into public.orders (
    id, order_number, profile_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_state, shipping_pincode,
    status, subtotal, shipping_fee, total, guest_token_hash
  ) values (
    v_order_id, v_order_number, auth.uid(), v_customer_name, v_customer_email, v_customer_phone,
    v_address, v_city, v_state, v_pincode,
    'Confirmed', v_subtotal, v_shipping_fee, v_subtotal + v_shipping_fee,
    case when v_guest_token is null then null else encode(sha256(convert_to(v_guest_token, 'UTF8')), 'hex') end
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    v_size := (v_item ->> 'size')::smallint;
    v_quantity := (v_item ->> 'quantity')::integer;
    update public.products set stock = stock - v_quantity where id = v_product.id;
    insert into public.order_items (order_id, product_id, product_sku, product_name, image_url, color, size, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.sku, v_product.name, v_product.image_url, v_product.color, v_size, v_quantity, v_product.price);
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', product_id, 'sku', product_sku, 'name', product_name,
    'image', image_url, 'color', color, 'size', size, 'quantity', quantity, 'price', unit_price
  ) order by created_at), '[]'::jsonb)
  into v_items from public.order_items where order_id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'status', 'Confirmed',
    'customer_name', v_customer_name, 'customer_email', v_customer_email, 'customer_phone', v_customer_phone,
    'shipping_address', v_address, 'shipping_city', v_city, 'shipping_state', v_state, 'shipping_pincode', v_pincode,
    'created_at', now(), 'subtotal', v_subtotal, 'shipping_fee', v_shipping_fee,
    'total', v_subtotal + v_shipping_fee, 'items', v_items, 'guest_token', v_guest_token
  );
end;
$$;

create or replace function public.get_guest_order(p_order_number text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_items jsonb;
begin
  if length(coalesce(p_token, '')) < 32 then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_order from public.orders
  where order_number = p_order_number
    and guest_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', product_id, 'sku', product_sku, 'name', product_name, 'image', image_url, 'color', color,
    'size', size, 'quantity', quantity, 'price', unit_price
  ) order by created_at), '[]'::jsonb)
  into v_items from public.order_items where order_id = v_order.id;
  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number, 'status', v_order.status,
    'customer_name', v_order.customer_name, 'customer_email', v_order.customer_email, 'customer_phone', v_order.customer_phone,
    'shipping_address', v_order.shipping_address, 'shipping_city', v_order.shipping_city,
    'shipping_state', v_order.shipping_state, 'shipping_pincode', v_order.shipping_pincode,
    'created_at', v_order.created_at, 'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee, 'total', v_order.total, 'items', v_items
  );
end;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_item record;
begin
  if not public.is_store_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_status not in ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status = 'Cancelled' and p_status <> 'Cancelled' then
    raise exception 'CANCELLED_ORDER_FINAL' using errcode = '22023';
  end if;
  if not (
    (v_order.status = 'Pending' and p_status in ('Pending', 'Confirmed', 'Cancelled'))
    or (v_order.status = 'Confirmed' and p_status in ('Confirmed', 'Packed', 'Cancelled'))
    or (v_order.status = 'Packed' and p_status in ('Packed', 'Shipped', 'Cancelled'))
    or (v_order.status = 'Shipped' and p_status in ('Shipped', 'Delivered'))
    or (v_order.status = 'Delivered' and p_status = 'Delivered')
    or (v_order.status = 'Cancelled' and p_status = 'Cancelled')
  ) then
    raise exception 'INVALID_STATUS_TRANSITION' using errcode = '22023';
  end if;
  if p_status = 'Cancelled' and v_order.status <> 'Cancelled' then
    if v_order.status in ('Shipped', 'Delivered') then
      raise exception 'CANNOT_CANCEL_AFTER_SHIPMENT' using errcode = '22023';
    end if;
    for v_item in
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id and product_id is not null
      group by product_id
      order by product_id
    loop
      update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
    end loop;
  end if;
  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.update_customer_profile(text, text) from public;
revoke all on function public.place_cod_order(jsonb, jsonb) from public;
revoke all on function public.get_guest_order(text, text) from public;
revoke all on function public.set_order_status(uuid, text) from public;
grant execute on function public.is_store_admin() to anon, authenticated;
grant execute on function public.update_customer_profile(text, text) to authenticated;
grant execute on function public.place_cod_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_guest_order(text, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to authenticated;

insert into public.products (sku, name, description, category, audience, price, compare_price, sizes, stock, color, color_hex, image_url, state, badge, rating, review_count, popularity, is_new)
values
  ('ST-001', 'The Everyday Runner', 'A cushioned everyday sneaker made for the long way home.', 'Sneakers', 'Men', 2490, 3290, array[6,7,8,9,10]::smallint[], 34, 'Black / Amber', '#c78219', '/images/step-on-hero.webp', 'Active', 'BESTSELLER', 0.0, 0, 98, true),
  ('ST-002', 'Sunday Leather Slide', 'An easy slip-on for slow days and sunny plans.', 'Slides', 'Women', 1890, null, array[5,6,7,8,9]::smallint[], 12, 'Cognac', '#9d603f', 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=900&q=85', 'Active', '', 0.0, 0, 84, true),
  ('ST-003', 'City Pace 02', 'Light, soft and ready for every little detour.', 'Sneakers', 'Women', 2790, 3490, array[5,6,7,8]::smallint[], 4, 'Cloud / Rose', '#d9a1a0', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85', 'Active', 'NEW ARRIVAL', 0.0, 0, 92, true),
  ('ST-004', 'The Weekender Boot', 'A grounded everyday boot with a little extra point of view.', 'Boots', 'Men', 3590, 4290, array[7,8,9,10]::smallint[], 0, 'Deep Brown', '#594333', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=900&q=85', 'Draft', '', 0.0, 0, 78, false),
  ('ST-005', 'Form & Function', 'Clean lines and all-day comfort, without making a fuss.', 'Sneakers', 'Men', 2990, null, array[6,7,8,9,10,11]::smallint[], 21, 'Chalk', '#ddd9cf', 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85', 'Active', 'JUST LANDED', 0.0, 0, 87, true),
  ('ST-006', 'Daylight Sandal', 'A comfortable sandal for longer, warmer days.', 'Sandals', 'Women', 2190, 2690, array[5,6,7,8]::smallint[], 8, 'Sienna', '#a86f4f', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85', 'Active', '', 0.0, 0, 90, false),
  ('ST-007', 'Off-Duty High Top', 'A relaxed high top that keeps its shape through the day.', 'Sneakers', 'Unisex', 3190, null, array[6,7,8,9,10]::smallint[], 9, 'Black / Ecru', '#363633', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85', 'Active', 'LOW STOCK', 0.0, 0, 81, false),
  ('ST-008', 'Easy Does It Mule', 'An easy everyday mule in a soft olive shade.', 'Slides', 'Women', 1690, null, array[5,6,7,8]::smallint[], 15, 'Soft Olive', '#96977b', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85', 'Active', '', 0.0, 0, 73, false)
on conflict (sku) do nothing;

insert into public.store_settings (id, store_name, store_email, free_delivery_threshold, delivery_fee, return_window_days)
values (1, 'STEPON Footwear', 'hello@stepon.store', 2499, 99, 7)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images" on storage.objects
for all to authenticated
using (bucket_id = 'product-images' and public.is_store_admin())
with check (bucket_id = 'product-images' and public.is_store_admin());
