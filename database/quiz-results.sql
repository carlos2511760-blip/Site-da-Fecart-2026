-- Fecart Quiz: resultados públicos, respostas e pódio
-- Execute no Supabase SQL Editor.

create table if not exists public.fecart_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null check (char_length(trim(participant_name)) between 1 and 80),
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.fecart_quiz_attempts enable row level security;

drop policy if exists "public can submit quiz attempts" on public.fecart_quiz_attempts;
create policy "public can submit quiz attempts"
on public.fecart_quiz_attempts
for insert to anon, authenticated
with check (
  char_length(trim(participant_name)) between 1 and 80
  and score between 0 and total_questions
  and jsonb_typeof(answers) = 'array'
);

drop policy if exists "public can read quiz ranking" on public.fecart_quiz_attempts;
create policy "public can read quiz ranking"
on public.fecart_quiz_attempts
for select to anon, authenticated
using (true);

grant select, insert on public.fecart_quiz_attempts to anon, authenticated;

-- O pódio não precisa de uma tabela separada.
-- Consulta dos três primeiros colocados:
select participant_name, score, total_questions, created_at
from public.fecart_quiz_attempts
order by score desc, created_at asc
limit 3;
