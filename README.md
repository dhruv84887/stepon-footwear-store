# STEPON Footwear Store

A responsive footwear storefront built with React and Vite. The interface includes light and dark themes, a product catalog, search and filters, product details, wishlist, cart, checkout, customer sign-in, and a store admin dashboard.

## Run locally

```sh
npm install
npm run dev
```

## Supabase status

This checkout is connected to the STEPON Supabase project. Its local `.env.local` contains the project URL and publishable key, and the database migrations plus starter catalog are installed. `.env.local` is ignored by Git. For another checkout or project, follow [BACKEND_SETUP.md](BACKEND_SETUP.md).

Email confirmation is enabled. Supabase **Authentication → URL Configuration** is set for the public GitHub Pages site and local Vite development. Configure a custom SMTP provider before sending confirmation or recovery email to real customers. The store supports COD orders; the owner account needs to register and then be promoted to admin. Never put a Supabase service-role or secret key in the browser app.

## Build

```sh
npm run build
npm run preview
```

Checkout currently supports cash on delivery. Online payment processing requires a payment-provider account and server-side payment verification.

