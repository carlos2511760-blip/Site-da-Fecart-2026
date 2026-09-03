# Site da Fecart 2026

Site editorial da Fecart: um portfólio de projetos, grupos e processos de robótica feitos por estudantes.

## Estrutura

- `index.html`: página principal, cards, detalhes dos projetos e área de manutenção oculta.
- `css/style.css` e `css/overrides.css`: identidade visual, componentes, curtidas e responsividade.
- `js/app.js`: carregamento, filtros, curtidas, Making Of e editor por código.
- `js/supabase-config.js`: URL e chave pública do Supabase.
- `data/content.json`: conteúdo inicial e fallback local.
- `database/supabase.sql`: tabelas, função de curtida e políticas do banco.
- `.github/workflows/pages.yml`: publicação automática no GitHub Pages.

## Grupos iniciais

A página começa com quatro grupos fixos e vazios:

- Alecrins dourados
- Fãotásticos
- SabOr robótica
- Acerto 404

## Banco de dados

O site usa o Supabase diretamente pela API REST. Execute `database/supabase.sql` no **SQL Editor** do projeto Supabase antes de usar o salvamento e as curtidas.

O banco possui uma tabela de projetos e uma tabela de contadores de curtidas. A função `fecart_like_project` incrementa o contador de forma atômica, evitando que duas curtidas simultâneas substituam uma à outra.

A chave incluída em `js/supabase-config.js` é uma chave pública de frontend. Ela nunca deve ser substituída por uma chave secreta de serviço. Como o site não possui login, as políticas de gravação do editor são deliberadamente abertas para cumprir o requisito de manutenção por código; isso significa que qualquer pessoa tecnicamente capaz de descobrir o endpoint poderia enviar alterações. Para uma área administrativa segura no futuro, será necessário um backend ou autenticação separada.

## Adicionar e editar projetos

Não existe botão público de edição. Pressione **Ctrl + Shift + \\** para abrir a área reservada de manutenção.

Dentro dela, é possível:

1. Adicionar um novo projeto.
2. Editar título, descrições, grupo, ano, status, imagem e Making Of.
3. Salvar os projetos no Supabase.
4. Exportar um JSON como backup local.
5. Restaurar o conteúdo inicial local.

O campo Making Of aceita uma lista JSON neste formato:

```json
[
  {
    "date": "12 fev 2026",
    "title": "Primeiro protótipo",
    "description": "A equipe testou a primeira ideia e registrou o que aprendeu."
  }
]
```

Os visitantes acessam o Making Of dentro do detalhe individual de cada projeto, na seção **“Por trás de tudo · making of”**.

## Curtidas

Ao abrir um projeto, o visitante pode clicar em **Curtir este projeto**. A curtida é registrada no Supabase sem exigir login. O navegador também guarda a identificação local do projeto curtido para evitar múltiplos cliques no mesmo dispositivo.

## Desenvolvimento local

Sirva o diretório por HTTP para que o carregamento dos arquivos JSON funcione:

```bash
python3 -m http.server 8080
```

Depois, acesse `http://localhost:8080`.

## Publicação

Todo push na branch `main` aciona o workflow de GitHub Pages. O site publicado está em:

<https://carlos2511760-blip.github.io/Site-da-Fecart-2026/>
