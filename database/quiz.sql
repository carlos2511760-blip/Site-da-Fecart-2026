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

delete from public.fecart_quiz_questions;
insert into public.fecart_quiz_questions (category, prompt, options, correct_index, sort_order) values
('Fecart', 'O que a Fecart incentiva nos seus projetos?', '["Curiosidade, colaboração e robótica", "Competição sem colaboração", "Apenas teoria"]'::jsonb, 0, 1),
('Lira Laser (Instrumento Musical)', 'Em vez de usar cordas normais, o que a Lira Laser usa para fazer som?', '["Fios de nylon extremamente finos.", "Feixes de luz laser.", "Botões de plástico sensíveis ao toque.", "Sensores de movimento infravermelho."]'::jsonb, 1, 2),
('Lira Laser (Instrumento Musical)', 'Como a Lira Laser ajuda na área da saúde?', '["Ensinando teoria musical básica para iniciantes.", "Auxiliando na reabilitação motora e terapia sensorial.", "Medindo os batimentos cardíacos do paciente pelo toque.", "Melhorando a audição através de frequências agudas."]'::jsonb, 1, 3),
('Lira Laser (Instrumento Musical)', 'Para qual público a Lira Laser foi pensada principalmente?', '["Pessoas com restrições de mobilidade ou sensibilidade física.", "Crianças que estão tendo o primeiro contato com a música.", "Músicos profissionais que buscam ritmos eletrônicos.", "Escolas de música clássica e orquestras."]'::jsonb, 0, 4),
('Bengala Inteligente (Acessibilidade)', 'Como a Bengala Inteligente consegue “sentir” obstáculos altos como galhos ou lixeiras suspensas?', '["Através de uma pequena câmera instalada na ponta.", "Emitindo ondas sonoras e escutando o eco, como um sonar.", "Conectando-se ao GPS do celular para Bluetooth.", "Usando um laser que escaneia o formato da calçada."]'::jsonb, 1, 5),
('Bengala Inteligente (Acessibilidade)', 'O que acontece se a pessoa que usa a bengala se sentir em perigo, cair ou se desorientar?', '["Ela aperta um botão de emergência que liga para um familiar ou cuidador.", "A Bengala aciona uma luz forte para chamar a atenção ao redor.", "O dispositivo envia uma mensagem de texto para o hospital mais próximo.", "A bengala vibra sem parar até que o perigo passe."]'::jsonb, 0, 6),
('Bengala Inteligente (Acessibilidade)', 'Qual é uma das grandes vantagens sociais da Bengala Inteligente?', '["Criar um aplicativo gratuito de mapas com áudio para pessoas cegas.", "Oferecer uma tecnologia assistiva de baixo custo e alta eficiência.", "Substituir completamente a necessidade de pisos táteis nas calçadas.", "Permitir que o usuário grave os caminhos que faz todos os dias."]'::jsonb, 1, 7),
('GuideBot (Carrinho Autônomo)', 'Qual é o principal objetivo do carrinho GuideBot?', '["Monitorar a segurança das ruas do bairro de forma automática.", "Ajudar pessoas com deficiência visual a se locomoverem com mais segurança.", "Carregar pequenos objetos pessoais ou ajudar durante uma caminhada.", "Substituir as cadeiras de rodas elétricas no futuro."]'::jsonb, 1, 8),
('GuideBot (Carrinho Autônomo)', 'O que o GuideBot faz sozinho quando seu sensor detecta um obstáculo na frente?', '["Emite um sinal sonoro até que a pessoa retire o objeto do caminho.", "Diminui a velocidade ao máximo para não machucar o usuário em caso de batida.", "Analisa o ambiente e muda de direção sozinho para evitar a colisão.", "Desliga os motores temporariamente por medida de segurança."]'::jsonb, 2, 9),
('GuideBot (Carrinho Autônomo)', 'O que a criação do GuideBot demonstra na prática?', '["Que a robótica e a programação podem solucionar problemas reais e melhorar a qualidade de vida.", "Que veículos autônomos são fáceis de construir mesmo sem componentes eletrônicos.", "Que as peças de computador atuais estão ficando cada vez mais descartáveis.", "Que o sistema Arduino serve exclusivamente para fabricar carros elétricos de verdade."]'::jsonb, 0, 10),
('Testador de Tempo de Reação (Saúde e Reflexo)', 'O que essa máquina mede de verdade quando a pessoa interage?', '["A força com que o botão é pressionado durante o jogo.", "O tempo exato, em milissegundos, que a pessoa leva para reagir à luz ou ao som.", "A quantidade de cliques rápidos que o usuário consegue dar em apenas um minuto.", "O nível de concentração do usuário no momento da sua respiração."]'::jsonb, 1, 11),
('Testador de Tempo de Reação (Saúde e Reflexo)', 'Por que o estímulo da máquina, a luz ou o som, aparece em um tempo surpresa e aleatório?', '["Para evitar que o usuário fique esperando a hora, garantindo que o reflexo medido seja real.", "Para testar se o cérebro da pessoa consegue se adaptar a atrasos lentos no sistema.", "Porque o equipamento precisa de alguns segundos de pausa para não superaquecer.", "Para permitir que o avaliador anote os resultados com calma no papel."]'::jsonb, 0, 12),
('Testador de Tempo de Reação (Saúde e Reflexo)', 'Além de ser um desafio divertido para feira, qual é a utilidade real dos dados coletados por essa máquina?', '["Testar a resistência física dos robôs e causar danos nos motores.", "Ajudar médicos e terapeutas na coleta de dados objetivos para avaliação cognitiva e reabilitação.", "Medir a velocidade de transmissão de energia elétrica na placa Arduino.", "Descobrir quais visitantes têm talento para serem programadores."]'::jsonb, 1, 13);
