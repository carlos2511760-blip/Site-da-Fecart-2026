-- Textos globais editáveis pelo modo de manutenção.
create table if not exists public.fecart_site_content (
  site_id text primary key check (site_id = 'home'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.fecart_site_content enable row level security;
drop policy if exists "public can read site content" on public.fecart_site_content;
create policy "public can read site content" on public.fecart_site_content for select to anon, authenticated using (true);
drop policy if exists "public can insert site content" on public.fecart_site_content;
create policy "public can insert site content" on public.fecart_site_content for insert to anon, authenticated with check (site_id = 'home');
drop policy if exists "public can update site content" on public.fecart_site_content;
create policy "public can update site content" on public.fecart_site_content for update to anon, authenticated using (site_id = 'home') with check (site_id = 'home');
grant select, insert, update on public.fecart_site_content to anon, authenticated;

insert into public.fecart_site_content (site_id, content)
values ('home', '{}'::jsonb)
on conflict (site_id) do nothing;
