-- Drivever Blog: ad_inquiries table (footer "광고 문의" submissions)
-- Date: 2026-05-27
--
-- Purpose:
--   The footer "광고 문의" link previously went to /about. This table lets
--   visitors submit advertising inquiries, viewable in the admin panel.
--
-- Privacy (important):
--   Inquiries contain contact info (email/phone), so — unlike comments — they
--   are NOT publicly readable. Anyone may INSERT (anon, forced status='new'),
--   but only the authenticated admin can SELECT / UPDATE / DELETE.
--
--   Because there is no anon SELECT policy, the public form must insert WITHOUT
--   `.select()` (no return representation), otherwise PostgREST would 401.

create table if not exists public.ad_inquiries (
  id         bigint generated always as identity primary key,
  company    text,
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  status     text not null default 'new',   -- new | read | replied | archived
  created_at timestamptz not null default now()
);

alter table public.ad_inquiries enable row level security;

-- Anyone can submit; submissions always start as 'new'.
create policy "ad_inquiries_insert_anon"
  on public.ad_inquiries for insert to anon
  with check (status = 'new');

create policy "ad_inquiries_insert_authenticated"
  on public.ad_inquiries for insert to authenticated
  with check (true);

-- Only the admin (authenticated) can read / update / delete inquiries.
create policy "ad_inquiries_select_authenticated"
  on public.ad_inquiries for select to authenticated
  using (true);

create policy "ad_inquiries_update_authenticated"
  on public.ad_inquiries for update to authenticated
  using (true) with check (true);

create policy "ad_inquiries_delete_authenticated"
  on public.ad_inquiries for delete to authenticated
  using (true);

create index if not exists ad_inquiries_created_at_idx
  on public.ad_inquiries (created_at desc);
