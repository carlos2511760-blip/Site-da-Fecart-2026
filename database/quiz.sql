-- Fecart Quiz: execute depois de database/supabase.sql no SQL Editor.
create table if not exists public.fecart_quiz_questions (
  id uuid primary key default gen_random_uuid(), category text not null default 'Quiz da Fecart', prompt text not null,
  options jsonb not null, correct_index integer not null check (correct_index >= 0), active boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
alter table public.fecart_quiz_questions add column if not exists category text not null default 'Quiz da Fecart';

create table if not exists public.fecart_quiz_attempts (
  id uuid primary key default gen_random_uuid(), participant_name text not null check (char_length(trim(participant_name)) between 1 and 80),
  score integer not null check (score >= 0), total_questions integer not null check (total_questions > 0), answers jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
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

-- Substitui as perguntas de demonstração pela versão atual do quiz.
delete from public.fecart_quiz_questions;
insert into public.fecart_quiz_questions (category, prompt, options, correct_index, sort_order) values
('Fecart', 'O que a Fecart incentiva nos seus projetos?', '["Curiosidade, colaboração e robótica", "Competição sem colaboração", "Apenas teoria"]'::jsonb, 0, 1),
('Lira Laser (Instrumentação)', 'Em vez de usar cordas normais, o que a Lira Laser usa para fazer som?', '["Fios de nylon extremamente finos.", "Feixes de luz laser.", "Botões de plástico sensíveis ao toque.", "Sensores de movimento infravermelho."]'::jsonb, 1, 2),
('Lira Laser (Instrumentação)', 'Como a Lira Laser ajuda na área da saúde?', '["Ensinando teoria musical básica para iniciantes.", "Auxiliando na reabilitação motora e terapia sensorial.", "Medindo os batimentos cardíacos do paciente pelo toque.", "Melhorando a audição através de frequências agudas."]'::jsonb, 1, 3),
('Lira Laser (Instrumentação)', 'Para qual público a Lira Laser foi pensada principalmente?', '["Pessoas com restrições de mobilidade ou sensibilidade física.", "Crianças que estão tendo o primeiro contato com a música.", "Músicos profissionais que buscam ritmos eletrônicos.", "Escolas de música clássica e orquestras."]'::jsonb, 0, 4),
('Bengala Inteligente (Acessibilidade)', 'Como a Bengala Inteligente consegue “sentir” obstáculos altos como galhos ou lixeiras suspensas?', '["Através de uma pequena câmera instalada na ponta.", "Emitindo ondas sonoras e estudando o eco, como um sonar.", "Conectando-se ao GPS do celular para Bluetooth.", "Usando um laser que escaneia o formato da calçada."]'::jsonb, 1, 5),
('Bengala Inteligente (Acessibilidade)', 'O que acontece se a pessoa que usa a bengala se sentir em perigo, cair ou se desorientar?', '["Ela aperta um botão de emergência que liga para um familiar ou cuidador.", "A Bengala aciona uma luz forte para chamar a atenção ao redor.", "O dispositivo envia uma mensagem de texto para o hospital mais próximo.", "A bengala vibra sem parar até que o perigo passe."]'::jsonb, 0, 6),
('Bengala Inteligente (Acessibilidade)', 'Qual é uma das grandes vantagens sociais da Bengala Inteligente?', '["Criar um aplicativo gratuito de mapas com áudio para pessoas cegas.", "Oferecer uma tecnologia assistiva de baixo custo e alta eficiência.", "Substituir completamente a necessidade de pisos táteis nas calçadas.", "Permitir que o usuário grave os caminhos que faz todos os dias."]'::jsonb, 1, 7),
('GuideBot (Carrinho Autônomo)', 'Qual é o principal objetivo do carrinho GuideBot?', '["Monitorar a segurança das ruas do bairro de forma automática.", "Ajudar pessoas com deficiência visual a se locomoverem com mais segurança.", "Carregar pequenos objetos pessoais ou ajudar durante uma caminhada.", "Substituir as cadeiras de rodas elétricas no futuro."]'::jsonb, 1, 8);
