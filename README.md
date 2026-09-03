# Site da Fecart 2026

Site editorial da Fecart: um portfólio de projetos, grupos e processos de robótica feitos por estudantes.

## Estrutura

- `index.html`: página principal, modal de projetos e painel de edição.
- `css/style.css`: identidade visual, componentes e responsividade.
- `js/app.js`: carregamento de dados, filtros, grupos, Making Of e editor.
- `data/content.json`: fonte de conteúdo do site.
- `assets/images/projects/`: imagens de projetos.
- `.github/workflows/pages.yml`: publicação automática no GitHub Pages.

## Grupos iniciais

A página começa com quatro grupos fixos:

- Alecrins dourados
- Fãotásticos
- SabOr robótica
- Acerto 404

Cada grupo possui um identificador estável e pode receber descrição, imagem e projetos relacionados no arquivo de conteúdo.

## Editar conteúdo pelo site

Pressione **Ctrl + Shift + \\** para abrir o modo de manutenção. Também é possível clicar em **Editar conteúdo** no cabeçalho em telas maiores.

O editor permite atualizar textos, descrições, títulos de projetos, caminhos de imagens e imagens locais. As alterações são salvas como rascunho no navegador. Para publicar alterações no repositório:

1. Abra o editor pelo atalho.
2. Faça as alterações e confira a prévia.
3. Clique em **Exportar JSON**.
4. Substitua `data/content.json` pelo arquivo exportado.
5. Revise o diff e faça commit e push na branch `main`.

O rascunho local não é um mecanismo de autenticação. O navegador não publica alterações no GitHub automaticamente.

## Desenvolvimento local

Por ser um site estático, ele pode ser servido por qualquer servidor local. Ao abrir diretamente como arquivo, alguns navegadores bloqueiam o `fetch` do JSON; use um servidor HTTP local para testar a aplicação completa.

Exemplo com Python:

```bash
python3 -m http.server 8080
```

Depois, acesse `http://localhost:8080`.

## Publicação

Todo push na branch `main` aciona o workflow de GitHub Pages. Nas configurações do repositório, selecione **GitHub Actions** como origem de publicação caso ainda não esteja configurado.
