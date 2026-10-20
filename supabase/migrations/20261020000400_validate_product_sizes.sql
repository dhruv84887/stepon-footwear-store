-- Every listed footwear product must have at least one valid size.
alter table public.products
  add constraint products_sizes_valid
  check (
    cardinality(sizes) between 1 and 20
    and array_position(sizes, null) is null
    and sizes <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]::smallint[]
  );
