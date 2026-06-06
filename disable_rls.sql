-- Disable RLS on all tables to allow the client app (even with local session) to read and write directly to Supabase.
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banners DISABLE ROW LEVEL SECURITY;
