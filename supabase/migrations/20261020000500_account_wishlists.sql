-- Keep signed-in customers' saved pairs isolated by their profile.
create table public.wishlist_items (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Customers read their wishlist"
on public.wishlist_items for select to authenticated
using (profile_id = (select auth.uid()));

create policy "Customers add to their wishlist"
on public.wishlist_items for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy "Customers remove from their wishlist"
on public.wishlist_items for delete to authenticated
using (profile_id = (select auth.uid()));

grant select, insert, delete on public.wishlist_items to authenticated;
