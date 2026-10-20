# STEPON Footwear Store

A responsive footwear storefront built with React and Vite. The interface includes light and dark themes, a product catalog, search and filters, product details, wishlist, cart, checkout, customer sign-in, and a store admin dashboard.

## Run locally

```sh
npm install
npm run dev
```

## Supabase status

This checkout is connected to the STEPON Supabase project. Its local `.env.local` contains the project URL and publishable key, and the database migrations plus starter catalog are installed. `.env.local` is ignored by Git. For another checkout or project, follow [BACKEND_SETUP.md](BACKEND_SETUP.md).

Email confirmation is enabled. Before signing up locally, add `http://localhost:5173/**` and `http://127.0.0.1:5173/**` under Supabase **Authentication → URL Configuration**. The store supports COD orders; the owner account needs to be promoted to admin after registration. Never put a Supabase service-role or secret key in the browser app.

## Build

```sh
npm run build
npm run preview
```

Checkout currently supports cash on delivery. Online payment processing requires a payment-provider account and server-side payment verification.

