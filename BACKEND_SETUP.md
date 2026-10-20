# STEPON backend setup

STEPON uses Supabase Auth, Postgres, and Storage for customer accounts, the product catalog, product photos, store settings, and COD orders. The connected `STEPON Footwear` project is in Mumbai (`ap-south-1`). The current workspace already has its project URL and publishable key in `.env.local`; that file is ignored by Git.

## Local development

1. Install dependencies with `npm install`.
2. If setting up another checkout, copy `.env.example` to `.env.local` and enter `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Restart Vite after changing environment variables. Never put a Supabase secret or service-role key in a `VITE_` variable or commit it.
4. Run `npm run dev` and open the local URL printed by Vite.

## Authentication setup

Email/password authentication is enabled, and email confirmation is currently required. Registration and password-reset links redirect to the website's current origin.

In **Supabase → Authentication → URL Configuration**:

- Set **Site URL** to the deployed website origin when one exists.
- Add local development redirects such as `http://localhost:5173/**` and `http://127.0.0.1:5173/**` to the redirect allow list.
- Add the deployed website origin and any needed paths to that allow list before production sign-up or password recovery.

The local redirect allow list still needs to be confirmed in the Supabase dashboard. Signup links are sent only after confirmation is enabled there; successful registration also requires a working email-delivery provider.

Configure a custom SMTP provider before sending confirmation and recovery emails to real customers. Supabase's built-in email service is for limited testing and is not intended for production delivery. See [Supabase custom SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).

Google sign-in is optional and disabled for this project. Its button stays hidden unless Google OAuth is configured in Supabase and `VITE_SUPABASE_GOOGLE_AUTH_ENABLED=true` is set. Add the Supabase OAuth callback URL to the Google OAuth client as well.

## Database migrations

The connected project has these migrations applied. For a new project, apply these SQL files in order:

1. `supabase/migrations/20261020000100_store_backend.sql`
2. `supabase/migrations/20261020000200_tighten_api_grants.sql`
3. `supabase/migrations/20261020000300_restrict_table_grants.sql`
4. `supabase/migrations/20261020000400_validate_product_sizes.sql`
5. `supabase/migrations/20261020000500_account_wishlists.sql`

They create customer profiles, products, store settings, COD orders and order items; enable row-level security; seed eight starter products; create the public `product-images` bucket; and install checkout, guest order lookup, profile update, and admin order-status functions. The second migration restricts RPC grants and separates public reads from admin writes. Checkout validates prices and available sizes on the server, locks product rows, and decrements stock transactionally. The fourth migration prevents products with invalid or missing size options from being saved. The fifth migration stores signed-in customers' wishlists under their own profile with row-level security.

## Enable the store owner's admin account

1. Register on the STEPON site with the owner's email and confirm that email.
2. Run this in the Supabase SQL Editor, replacing the email with the exact address used to register:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'OWNER_EMAIL_HERE');
   ```

3. Sign in to **Store admin** with that account. Admin routes and order-status changes verify the profile role on the server.

## Payment method

Checkout currently supports cash on delivery. Online payments require a payment-provider account and server-side payment verification before they can be enabled.
