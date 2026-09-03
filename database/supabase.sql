-- Fecart: banco simples para projetos editáveis e curtidas públicas
-- Execute este arquivo no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.fecart_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default 'Novo projeto',
  short_description text not null default '',
  full_description text not null default '',
  group_id text not null default '',
  year text not null default '',
  status text not null default '',
  tags jsonb not null default '[]'::jsonb,
  team jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  featured boolean not null default false,
  roots jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fecart_project_likes (
  project_id uuid primary key references public.fecart_projects(id) on delete cascade,
  likes_count integer not null default 0 check (likes_count >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.fecart_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fecart_projects_touch on public.fecart_projects;
create trigger fecart_projects_touch
before update on public.fecart_projects
for each row execute function public.fecart_touch_updated_at();

create or replace function public.fecart_like_project(project_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  insert into public.fecart_project_likes(project_id, likes_count)
  values (project_uuid, 1)
  on conflict (project_id)
  do update set likes_count = public.fecart_project_likes.likes_count + 1, updated_at = now()
  returning likes_count into new_count;
  return new_count;
end;
$$;

alter table public.fecart_projects enable row level security;
alter table public.fecart_project_likes enable row level security;

drop policy if exists "public can read projects" on public.fecart_projects;
create policy "public can read projects" on public.fecart_projects for select using (true);

-- Sem login, estas políticas permitem que o editor por código de manutenção
-- grave projetos via chave pública. Para segurança real, troque por uma API
-- administrativa protegida antes de colocar o editor em produção pública.
drop policy if exists "public can insert projects" on public.fecart_projects;
create policy "public can insert projects" on public.fecart_projects for insert with check (true);

drop policy if exists "public can update projects" on public.fecart_projects;
create policy "public can update projects" on public.fecart_projects for update using (true) with check (true);

drop policy if exists "public can read likes" on public.fecart_project_likes;
create policy "public can read likes" on public.fecart_project_likes for select using (true);

-- O site usa o código de atalho para enviar alterações via REST.
-- Não existe login no site público; por isso, a gravação administrativa deve
-- ser protegida por uma chave de manutenção separada antes de ser ativada.
-- A função de curtida é pública e só incrementa o contador do projeto.
revoke all on function public.fecart_like_project(uuid) from public;
grant execute on function public.fecart_like_project(uuid) to anon, authenticated;

grant select on public.fecart_projects to anon, authenticated;
grant select on public.fecart_project_likes to anon, authenticated;
grant insert, update on public.fecart_projects to anon, authenticated;
