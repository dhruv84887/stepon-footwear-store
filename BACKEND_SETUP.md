# STEPON backend setup

STEPON uses Supabase Auth, Postgres, and Storage for customer accounts, the catalog, product photos, store settings, and COD orders. In the browser, use only the project URL and its publishable/anon key. Never put a service-role or secret key in a `VITE_` variable.

## Connect the Supabase project

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. A legacy anon key also works in that setting. `.env.local` is ignored by Git.
3. Restart the Vite server after changing environment variables.
4. In the Supabase SQL Editor, run `supabase/migrations/20261020000100_store_backend.sql`.
5. In Supabase Authentication settings, add the local website origin to the allowed redirect URLs. For local development, this is the origin shown in the browser address bar, such as `http://127.0.0.1:5173`.
6. Create the store owner's account from the STEPON sign-in page. Then promote that user's profile in the SQL Editor, replacing the example email:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'OWNER_EMAIL_HERE');
   ```

7. Sign in to **Store admin** with that email and password. Admin access is checked against the profile role; a regular customer account cannot open the dashboard.

The migration creates the database tables and row-level security rules, seeds the eight starter products, creates the public `product-images` bucket, and installs transactional COD checkout and admin order-status functions. Checkout calculates delivery and price on the server and locks product rows before reserving stock.

Google sign-in is optional. To enable the Google button, configure Google as an OAuth provider in Supabase and add its callback URL to the Google OAuth client. Otherwise, email/password accounts work normally.

## Local preview without credentials

When `.env.local` is not configured, the storefront remains in local preview mode. Its demo account, catalog, cart, settings, and orders are stored in this browser only; this is not real authentication or store data.

## Current payment method

Checkout currently supports cash on delivery. Online payments need a payment provider account and a server-side verification flow before they can be enabled.
