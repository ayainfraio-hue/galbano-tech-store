-- Storefront settings, partner brands and customer testimonial gallery.
-- This migration was applied to the Galbano Tech Supabase project.
create table if not exists public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  whatsapp_number text not null default '556292643627' check (whatsapp_number ~ '^[0-9]{10,15}$'),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  top_notice_1 text not null default 'Tecnologia premium com atendimento personalizado',
  top_notice_2 text not null default 'Peça pelo WhatsApp e receba atendimento exclusivo',
  store_name text not null default 'Gálbano Tech',
  email text not null default '',
  instagram text not null default '',
  business_hours text not null default '',
  address text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values ('default') on conflict (id) do nothing;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
alter table public.store_settings enable row level security;
create policy "Public reads store settings" on public.store_settings for select to anon, authenticated using (true);
create policy "Admins update store settings" on public.store_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger store_settings_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

create table if not exists public.store_brands (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
grant select on public.store_brands to anon, authenticated;
grant insert, update, delete on public.store_brands to authenticated;
alter table public.store_brands enable row level security;
create policy "Public reads active brands" on public.store_brands for select to anon, authenticated using (active = true);
create policy "Admins read all brands" on public.store_brands for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert brands" on public.store_brands for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update brands" on public.store_brands for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete brands" on public.store_brands for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
insert into public.store_brands (name, sort_order) values ('Aurum',1),('Nexa',2),('Voltix',3),('Pulse',4),('Orbit',5),('Kairo',6),('Lumen',7),('Vertex',8) on conflict do nothing;

create table if not exists public.customer_gallery (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null default 'Cliente',
 message text not null,
 image_url text not null,
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
grant select on public.customer_gallery to anon, authenticated;
grant insert, update, delete on public.customer_gallery to authenticated;
alter table public.customer_gallery enable row level security;
create policy "Public reads active customer gallery" on public.customer_gallery for select to anon, authenticated using (active = true);
create policy "Admins read all customer gallery" on public.customer_gallery for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert customer gallery" on public.customer_gallery for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update customer gallery" on public.customer_gallery for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete customer gallery" on public.customer_gallery for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('customer-gallery','customer-gallery',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "Public reads customer gallery images" on storage.objects for select to anon, authenticated using (bucket_id='customer-gallery');
create policy "Admins upload customer gallery images" on storage.objects for insert to authenticated with check (bucket_id='customer-gallery' and public.has_role(auth.uid(),'admin'));
create policy "Admins update customer gallery images" on storage.objects for update to authenticated using (bucket_id='customer-gallery' and public.has_role(auth.uid(),'admin')) with check (bucket_id='customer-gallery' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete customer gallery images" on storage.objects for delete to authenticated using (bucket_id='customer-gallery' and public.has_role(auth.uid(),'admin'));