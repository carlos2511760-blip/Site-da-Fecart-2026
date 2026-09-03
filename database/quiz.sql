-- Fecart Quiz: execute depois de database/supabase.sql no SQL Editor.
create table if not exists public.fecart_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fecart_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null check (char_length(trim(participant_name)) between 1 and 80),
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.fecart_quiz_questions enable row level security;
alter table public.fecart_quiz_attempts enable row level security;

drop policy if exists "public can read quiz questions" on public.fecart_quiz_questions;
create policy "public can read quiz questions" on public.fecart_quiz_questions for select using (active = true);

drop policy if exists "public can submit quiz attempts" on public.fecart_quiz_attempts;
create policy "public can submit quiz attempts" on public.fecart_quiz_attempts for insert with check (true);

drop policy if exists "public can read quiz ranking" on public.fecart_quiz_attempts;
create policy "public can read quiz ranking" on public.fecart_quiz_attempts for select using (true);

grant select on public.fecart_quiz_questions to anon, authenticated;
grant select, insert on public.fecart_quiz_attempts to anon, authenticated;

insert into public.fecart_quiz_questions (prompt, options, correct_index, sort_order)
select * from (values
  ('O que a Fecart incentiva nos seus projetos?', '["Curiosidade, colaboração e robótica", "Competição sem colaboração", "Apenas teoria"]'::jsonb, 0, 1),
  ('Onde o visitante encontra o Making Of de um projeto?', '["Dentro do detalhe individual do projeto", "Somente no rodapé", "Em uma página externa"]'::jsonb, 0, 2),
  ('Quais são grupos fixos da Fecart?', '["Alecrins dourados, Fãotásticos, SabOr robótica e Acerto 404", "Equipe A, Equipe B e Equipe C", "Nenhum grupo"]'::jsonb, 0, 3),
  ('O que um projeto pode registrar no Making Of?', '["Etapas, descobertas e aprendizados", "Somente a nota final", "Apenas o nome do projeto"]'::jsonb, 0, 4),
  ('Como o visitante demonstra que gostou de um projeto?', '["Clicando no botão de curtir", "Enviando um e-mail obrigatório", "Criando uma conta"]'::jsonb, 0, 5)
) as seed(prompt, options, correct_index, sort_order)
where not exists (select 1 from public.fecart_quiz_questions);
