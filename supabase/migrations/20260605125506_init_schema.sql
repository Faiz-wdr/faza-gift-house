-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Customers Table
create table public.customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    phone text,
    address text,
    created_at timestamptz default now() not null
);

-- 3. Products Table
create table public.products (
    id uuid primary key default uuid_generate_v4(),
    product_id text unique not null,
    name text not null,
    image_url text,
    featured_on_homepage boolean default false not null,
    popularity integer default 50 not null,
    created_at timestamptz default now() not null
);

-- 4. Product Sizes Table
create table public.product_sizes (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    size_name text not null,
    width text,
    height text,
    enabled boolean default true not null,
    unique(product_id, size_name)
);

-- 5. Product Materials Table
create table public.product_materials (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    material_name text not null,
    enabled boolean default true not null,
    unique(product_id, material_name)
);

-- 6. Product Pricing Table (Pricing Matrix)
create table public.product_pricing (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    size_name text not null,
    material_name text not null,
    price numeric(10, 2) not null,
    unique(product_id, size_name, material_name)
);

-- 7. Orders Table
create table public.orders (
    id uuid primary key default uuid_generate_v4(),
    order_id text unique not null,
    customer_id uuid references public.customers(id) on delete restrict not null,
    status text default 'Pending'::text not null,
    payment_status text default 'Pending'::text not null,
    total_amount numeric(10, 2) default 0.00 not null,
    paid_amount numeric(10, 2) default 0.00 not null,
    pending_amount numeric(10, 2) default 0.00 not null,
    tracking_id text,
    delivery_date date,
    created_at timestamptz default now() not null
);

-- 8. Order Items Table
create table public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete restrict not null,
    size_name text not null,
    material_name text not null,
    quantity integer not null,
    unit_price numeric(10, 2) not null,
    total_price numeric(10, 2) not null
);

-- 9. Ad Banners Table
create table public.ad_banners (
    id uuid primary key default uuid_generate_v4(),
    image_url text not null,
    name text not null,
    size text not null,
    created_at timestamptz default now() not null
);

-- 10. Enable Row Level Security (RLS) & Policies
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_materials enable row level security;
alter table public.product_pricing enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ad_banners enable row level security;

-- Anonymous users can read products, pricing matrices, and ad banners
create policy "Allow public read access to products" on public.products for select using (true);
create policy "Allow public read access to product sizes" on public.product_sizes for select using (true);
create policy "Allow public read access to product materials" on public.product_materials for select using (true);
create policy "Allow public read access to product pricing" on public.product_pricing for select using (true);
create policy "Allow public read access to ad banners" on public.ad_banners for select using (true);

-- Authenticated admins can do everything
create policy "Allow full access to authenticated admins for customers" on public.customers using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for products" on public.products using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for product sizes" on public.product_sizes using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for product materials" on public.product_materials using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for product pricing" on public.product_pricing using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for orders" on public.orders using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for order items" on public.order_items using (auth.role() = 'authenticated');
create policy "Allow full access to authenticated admins for ad banners" on public.ad_banners using (auth.role() = 'authenticated');

-- 11. Create Admin User (faza@fazagifthouse.com / 123)
do $$
declare
  new_user_id uuid := uuid_generate_v4();
begin
  if not exists (select 1 from auth.users where email = 'faza@fazagifthouse.com') then
    -- Insert into auth.users
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'faza@fazagifthouse.com',
      extensions.crypt('123', extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );

    -- Insert into auth.identities
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      new_user_id,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, 'faza@fazagifthouse.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  end if;
end $$;
