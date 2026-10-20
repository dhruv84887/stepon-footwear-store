-- Support product foreign-key checks and cascades for customer wishlists.
create index wishlist_items_product_id_idx
  on public.wishlist_items (product_id);
