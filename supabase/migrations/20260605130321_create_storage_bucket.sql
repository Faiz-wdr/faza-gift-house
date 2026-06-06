-- 1. Create public bucket if not exists
insert into storage.buckets (id, name, public)
values ('faza-assets', 'faza-assets', true)
on conflict (id) do nothing;

-- 2. Allow public read access to faza-assets bucket objects
drop policy if exists "Allow public read access to assets" on storage.objects;
create policy "Allow public read access to assets"
on storage.objects for select using (bucket_id = 'faza-assets');

-- 3. Allow authenticated admins full access to faza-assets bucket objects
drop policy if exists "Allow authenticated admin full access to assets" on storage.objects;
create policy "Allow authenticated admin full access to assets"
on storage.objects for all using (
  bucket_id = 'faza-assets' and auth.role() = 'authenticated'
);
