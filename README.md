# STEPON Footwear Store

A responsive footwear storefront built with React and Vite. The interface includes light and dark themes, a product catalog, search and filters, product details, wishlist, cart, checkout, customer sign-in, and a store admin dashboard.

## Run locally

```sh
npm install
npm run dev
```

## Connect Supabase

The storefront can run in local preview mode without credentials. To enable live authentication and store data:

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the public values from your Supabase project.
3. Apply `supabase/migrations/20261020000100_store_backend.sql` in the Supabase SQL Editor.
4. Restart the Vite server.

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for the full setup, including admin access. Never put a Supabase service-role or secret key in the browser app.

## Build

```sh
npm run build
npm run preview
```

Checkout currently supports cash on delivery. Online payment processing and a live Supabase project still need to be configured before the store can take real orders.

