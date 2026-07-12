-- KANÈ TILE STUDIO — configurazione Supabase
-- Esegui questo file nel SQL Editor del progetto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_code text not null unique,
  email text not null,
  quantity integer not null,
  configuration jsonb not null,
  source_file_path text not null,
  status text not null default 'nuovo',

  constraint orders_email_length check (char_length(email) between 3 and 254),
  constraint orders_email_basic_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint orders_quantity_range check (quantity between 1 and 10000),
  constraint orders_status_allowed check (
    status in ('nuovo', 'in_valutazione', 'confermato', 'rifiutato', 'completato')
  )
);

alter table public.orders enable row level security;

-- Nessun visitatore può leggere, modificare o cancellare gli ordini.
revoke all on table public.orders from anon, authenticated;
grant insert on table public.orders to anon;

drop policy if exists "public_can_insert_orders" on public.orders;
create policy "public_can_insert_orders"
on public.orders
for insert
to anon
with check (
  status = 'nuovo'
  and quantity between 1 and 10000
  and char_length(email) between 3 and 254
);

-- Bucket privato per i file grafici.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'order-files',
  'order-files',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Il pubblico può soltanto caricare nuovi file nel bucket.
drop policy if exists "public_can_upload_order_files" on storage.objects;
create policy "public_can_upload_order_files"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'order-files'
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

-- Non vengono create policy SELECT, UPDATE o DELETE per anon:
-- i visitatori non possono vedere né cambiare i file caricati.


