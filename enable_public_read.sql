-- Enable RLS but add SELECT policies for anonymous (public) users
-- Run this in Supabase SQL Editor to allow public site visitors to read products and banners

-- Products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products
  FOR SELECT USING (true);

-- Product Sizes table
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on product_sizes" ON public.product_sizes;
CREATE POLICY "Allow public read access on product_sizes" ON public.product_sizes
  FOR SELECT USING (true);

-- Product Materials table
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on product_materials" ON public.product_materials;
CREATE POLICY "Allow public read access on product_materials" ON public.product_materials
  FOR SELECT USING (true);

-- Product Pricing table
ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on product_pricing" ON public.product_pricing;
CREATE POLICY "Allow public read access on product_pricing" ON public.product_pricing
  FOR SELECT USING (true);

-- Ad Banners table
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on ad_banners" ON public.ad_banners;
CREATE POLICY "Allow public read access on ad_banners" ON public.ad_banners
  FOR SELECT USING (true);

-- Allow authenticated users (admin) full access to all tables
DROP POLICY IF EXISTS "Allow authenticated full access on products" ON public.products;
CREATE POLICY "Allow authenticated full access on products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access on product_sizes" ON public.product_sizes;
CREATE POLICY "Allow authenticated full access on product_sizes" ON public.product_sizes
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access on product_materials" ON public.product_materials;
CREATE POLICY "Allow authenticated full access on product_materials" ON public.product_materials
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access on product_pricing" ON public.product_pricing;
CREATE POLICY "Allow authenticated full access on product_pricing" ON public.product_pricing
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access on ad_banners" ON public.ad_banners;
CREATE POLICY "Allow authenticated full access on ad_banners" ON public.ad_banners
  FOR ALL USING (auth.role() = 'authenticated');
