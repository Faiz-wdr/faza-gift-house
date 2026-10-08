-- ============================================================================
-- FAZA GIFT HOUSE: Complete Supabase Database Setup & RLS Policy Fix
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/atpevkhuucgasqfbrpoh/sql/new
-- ============================================================================

-- 1. Create finance_transactions table if it does not exist
create table if not exists public.finance_transactions (
    id text primary key,
    type text not null check (type in ('income', 'expense')),
    amount numeric(10, 2) not null check (amount >= 0),
    date date not null,
    description text not null,
    category text,
    payment_method text,
    order_id text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_finance_transactions_date on public.finance_transactions(date);
create index if not exists idx_finance_transactions_type on public.finance_transactions(type);
create index if not exists idx_finance_transactions_order on public.finance_transactions(order_id);

-- 2. Ensure all tables have Row Level Security enabled
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_materials enable row level security;
alter table public.product_pricing enable row level security;
alter table public.ad_banners enable row level security;

-- 3. Drop any older restrictive policies on these tables
drop policy if exists "Allow full access to authenticated admins for customers" on public.customers;
drop policy if exists "Allow full access to authenticated admins for orders" on public.orders;
drop policy if exists "Allow full access to authenticated admins for order items" on public.order_items;
drop policy if exists "Allow full access to authenticated admins for products" on public.products;
drop policy if exists "Allow full access to authenticated admins for product sizes" on public.product_sizes;
drop policy if exists "Allow full access to authenticated admins for product materials" on public.product_materials;
drop policy if exists "Allow full access to authenticated admins for product pricing" on public.product_pricing;
drop policy if exists "Allow full access to authenticated admins for ad banners" on public.ad_banners;

drop policy if exists "Allow anon and auth full access to customers" on public.customers;
drop policy if exists "Allow anon and auth full access to orders" on public.orders;
drop policy if exists "Allow anon and auth full access to order items" on public.order_items;
drop policy if exists "Allow anon and auth full access to finance_transactions" on public.finance_transactions;
drop policy if exists "Allow authenticated full access to finance_transactions" on public.finance_transactions;
drop policy if exists "Allow anon full access to finance_transactions (if public admin)" on public.finance_transactions;
drop policy if exists "Allow anon and auth full access to products" on public.products;
drop policy if exists "Allow anon and auth full access to product sizes" on public.product_sizes;
drop policy if exists "Allow anon and auth full access to product materials" on public.product_materials;
drop policy if exists "Allow anon and auth full access to product pricing" on public.product_pricing;
drop policy if exists "Allow anon and auth full access to ad banners" on public.ad_banners;

-- 4. Create universal access policies (for anon and authenticated users)
-- This allows all devices using the frontend anon key to read and write seamlessly

create policy "Allow anon and auth full access to customers"
    on public.customers for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to orders"
    on public.orders for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to order items"
    on public.order_items for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to finance_transactions"
    on public.finance_transactions for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to products"
    on public.products for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to product sizes"
    on public.product_sizes for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to product materials"
    on public.product_materials for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to product pricing"
    on public.product_pricing for all
    using (true)
    with check (true);

create policy "Allow anon and auth full access to ad banners"
    on public.ad_banners for all
    using (true)
    with check (true);

-- 5. Storage policies for faza-assets bucket (allows uploading product/banner images from any device)
insert into storage.buckets (id, name, public)
values ('faza-assets', 'faza-assets', true)
on conflict (id) do nothing;

drop policy if exists "Allow public read access to assets" on storage.objects;
create policy "Allow public read access to assets"
    on storage.objects for select
    using (bucket_id = 'faza-assets');

drop policy if exists "Allow full access to assets" on storage.objects;
create policy "Allow full access to assets"
    on storage.objects for all
    using (bucket_id = 'faza-assets')
    with check (bucket_id = 'faza-assets');
