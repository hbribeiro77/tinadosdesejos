# Tina dos desejos — resumo do projeto

Aplicação **Next.js (App Router)** para organizar melhorias e demandas em um **quadro tipo Kanban**: cada **coluna** representa uma página ou funcionalidade do sistema; cada **card** referencia uma **issue do GitLab** a partir de uma **URL colada**.

## Jornada do usuário

1. Abre a página inicial e vê o quadro (persistido no **navegador** via `localStorage`).
2. Renomeia o título do quadro e o título das colunas para refletir áreas do produto.
3. Adiciona colunas conforme necessidade.
4. Em uma coluna, clica em **“+ Issue”**: pode **colar a URL** da issue (`.../-/issues/:iid`) ou usar a aba **Criar no GitLab** para abrir issue no projeto configurado em **`GITLAB_CREATE_ISSUE_PROJECT_PATH`** (padrão `portal-da-defensoria/portal-defensoria-gateway`, o mesmo namespace da URL web), com título e descrição opcional; o servidor chama **`POST /api/gitlab/issues/create-in-project`** e o card usa a URL retornada.
5. A aplicação chama a rota **`POST /api/gitlab/issues/resolve`**, que busca metadados no GitLab (ou retorna **mock** em desenvolvimento) e o card passa a exibir título, estado, labels, link etc.
6. Pode **arrastar cards** entre colunas (isso altera só o quadro local; **não** muda a issue no GitLab).
7. Usa **Atualizar** no card para reconsultar a API.
8. Pode **exportar/importar JSON** do quadro para backup ou troca entre máquinas.
9. Abre **Triagem GitLab** (gaveta), clica em **Atualizar lista** e busca issues **abertas** com a label de triagem em todo o **grupo** `portal-da-defensoria` (inclui subprojetos), via **`POST /api/gitlab/issues/triage-group-list`**.
10. **Arrasta** issues da gaveta para uma coluna: vira card no quadro (com snapshot). Issues que já estão no quadro **não aparecem** na gaveta.

## Integração GitLab (self-hosted)

- Variáveis de ambiente no **servidor** (nunca no browser):
  - `GITLAB_BASE_URL`: origem do GitLab (ex.: `https://gitlab.suaempresa.local`).
  - `GITLAB_TOKEN`: token enviado como **`PRIVATE-TOKEN`** nas chamadas `GET`/`POST` à API v4 (precisa de escopo que permita **criar issue** no projeto de criação, se usar o modal “Criar no GitLab”).
  - `GITLAB_CREATE_ISSUE_PROJECT_PATH`: path do projeto para criação de issues pelo modal (padrão `portal-da-defensoria/portal-defensoria-gateway` — grupo + projeto, como na URL).
  - `GITLAB_CREATE_ISSUE_DEFAULT_LABELS`: CSV de nomes de labels aplicadas ao criar issue pelo modal (padrão `squad::bravo`; string vazia = sem labels na criação).
- A rota valida que o **host da URL da issue** é o **mesmo origin** de `GITLAB_BASE_URL` (mitigação simples de SSRF).
- Modo **`GITLAB_MOCK=1`**: não chama GitLab; retorna dados sintéticos para desenvolver a UI sem credenciais.
- Se `GITLAB_BASE_URL`/`GITLAB_TOKEN` não estiverem definidos e o mock estiver desligado, a API responde com erro **`gitlab_not_configured`**.
- Triagem na gaveta: **`GITLAB_TRIAGE_GROUP_PATH`** (padrão `portal-da-defensoria`) e **`GITLAB_TRIAGE_LABEL`** (padrão `Triagem de issues`). A API usa `GET /api/v4/groups/:id/issues` com `include_subgroups=true`.
- TLS em dev: **`GITLAB_TLS_INSECURE_DEV=1`** faz as rotas GitLab usarem `https` ignorando verificação de certificado **só nesses requests** (não usar em produção).

## Limitações do MVP

- Persistência **apenas local** (`localStorage`); não há multiusuário nem servidor de dados.
- **Sem login** no app: a segurança depende do controle do token no backend e do acesso à instância GitLab.
- Certificados TLS internos / CA customizada são, em geral, **configuração de ambiente** (ex.: `NODE_EXTRA_CA_CERTS`), não regra de negócio do app.
- O arquivo [`.env.example`](.env.example) lista as variáveis sugeridas.

## Scripts úteis

- `npm run dev`: desenvolvimento.
- `npm run build`: build de produção.
- `npm run test`: testes unitários (parser de URL do GitLab).
