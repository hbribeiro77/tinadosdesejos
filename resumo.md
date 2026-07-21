# Tina dos desejos — resumo do projeto

Aplicação **Next.js (App Router)** para organizar melhorias e demandas em um **quadro tipo Kanban**: cada **coluna** representa uma página ou funcionalidade do sistema; cada **card** referencia uma **issue do GitLab** a partir de uma **URL colada**.

## Node.js **só neste projeto** (22)

Este repo pede **Node 22** (`.nvmrc` / `.node-version`). Outros projetos podem continuar em Node 20.

**nvm-windows** (na pasta do projeto):

```powershell
nvm install 22
nvm use
node -v
npm run ensure:sqlite
npm run dev
```

**fnm** (com auto-use ao entrar na pasta, se configurado): `fnm install` e `fnm use` leem `.node-version`.

**Volta**: se tiver [Volta](https://volta.sh) instalado, o `package.json` já fixa Node `22.14.0` ao rodar scripts aqui.

Não misture: `npm run ensure:sqlite` e `npm run dev` no **mesmo** terminal, depois de `nvm use` / `fnm use`.

## Persistência

| Dado | Onde fica |
|------|-----------|
| **Quadro Kanban** | **SQLite** (`data/triage.db`), via `GET`/`PUT` `/api/wish-kanban-board/persisted-v1` |
| **Imagens da descrição GitLab** (espelho) | **`data/gitlab-description-uploaded-assets-v1/`** — copiadas no resolve/atualizar; servidas por `/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/{hash}.{ext}` |
| **Tarefas SmartTask importadas** | Mesmo banco, `/api/wish-smart-task/imported-tasks-persisted-v1` |
| **Histórico DVITU (exemplos por eixo/nota)** | Tabela `triage_history` no mesmo SQLite |
| **Preferências de UI** (aba do modal de issue, CSV de labels na gaveta) | **`localStorage`** no navegador |

O diretório **`data/`** está no `.gitignore` (dados locais por máquina/servidor): inclui `triage.db` e a pasta de imagens espelhadas.

**Na VPS:** monte volume persistente em `data/` para sobreviver a redeploy. Faça backup de **`data/triage.db`** e **`data/gitlab-description-uploaded-assets-v1/`** (ou export JSON do quadro; cards antigos precisam de **Atualizar** uma vez para espelhar imagens da descrição).

### Migração do `localStorage` legado

Na primeira carga após o deploy: se o SQLite estiver **vazio** e ainda existir quadro ou SmartTask no `localStorage`, a app **copia para o servidor** e remove a cópia do navegador após gravação bem-sucedida.

### Backup em JSON

- **Exportar** / **Importar** na barra do quadro usam `{ "version": 1, "board": ... }`.
- **Importar** grava no SQLite; se já houver quadro no servidor, pede **confirmação** antes de substituir.

## Jornada do usuário

1. Abre a página inicial; o quadro é carregado do **servidor** (com migração automática do `localStorage` se aplicável).
2. Renomeia o título do quadro e o título das colunas para refletir áreas do produto.
3. Adiciona colunas conforme necessidade.
4. Em uma coluna, clica em **“+ Issue”**: pode **colar a URL** da issue (`.../-/issues/:iid`) ou usar a aba **Criar no GitLab** para abrir issue no projeto configurado em **`GITLAB_CREATE_ISSUE_PROJECT_PATH`** (padrão `portal-da-defensoria/portal-defensoria-gateway`, o mesmo namespace da URL web), com título e descrição opcional; o servidor chama **`POST /api/gitlab/issues/create-in-project`** e o card usa a URL retornada.
5. A aplicação chama a rota **`POST /api/gitlab/issues/resolve`**, que busca metadados no GitLab (ou retorna **mock** em desenvolvimento) e o card passa a exibir título, estado, labels, link etc.
6. Pode **arrastar cards** entre colunas (isso altera só o quadro local; **não** muda a issue no GitLab). Alterações no quadro são **salvas no servidor** (debounce ~450 ms).
7. Usa **Atualizar** no card para reconsultar a API (inclui descrição Markdown e **espelho local** de imagens `/uploads/`).
8. Clica em **Ver descrição** no card para abrir modal com o markdown (imagens servidas da pasta `data/` após espelho).
9. Pode **exportar/importar JSON** do quadro para backup ou restore.
10. Abre **Triagem GitLab** (gaveta), clica em **Atualizar lista** e busca issues **abertas** com a label de triagem em todo o **grupo** `portal-da-defensoria` (inclui subprojetos), via **`POST /api/gitlab/issues/triage-group-list`**.
11. **Arrasta** issues da gaveta para uma coluna: vira card no quadro (com snapshot). Issues que já estão no quadro **não aparecem** na gaveta.
12. Cards elegíveis podem aplicar matrizes **DVITU** (melhorias) ou **GUT** (bugs), atualizando a issue no GitLab e registrando histórico no SQLite.

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

## SmartTask

- Snapshot: `SMARTTASK_SNAPSHOT_BASE_URL` + `SMARTTASK_INTEGRATION_API_KEY` → `GET /api/smarttask/snapshot`.
- Handoff: `NEXT_PUBLIC_SMARTTASK_HANDOFF_ALLOWED_ORIGINS` (e origens localhost em dev).

## Modo visualização

- **`WISH_VIEW_ONLY_MODE=1`** no servidor: instância “viewer” — UI congelada; bloqueia create/resolve/triagem/DVITU/GUT, snapshot SmartTask, proxies de imagem e mutações de histórico. Mantém **GET** do quadro e servir assets já espelhados em `data/`. Não espelha imagens novas no GET/PUT do board.
- **`WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY`**: obrigatória em view-only. O **PUT** do quadro (Importar) exige `Authorization: Bearer <key>`; sem a env configurada, todo PUT retorna **403** (`unauthorized_import`). A UI pede a chave e guarda só em `sessionStorage` da aba.
- Sem `WISH_VIEW_ONLY_MODE`: editor completo (autosave sem chave). Na toolbar, **Prévia produção** congela só a UI.
- Flags: `GET /api/wish-app-runtime-flags-v1` → `{ viewOnlyMode, boardImportRequiresApiKey }`.

### Deploy viewer (checklist)

1. `WISH_VIEW_ONLY_MODE=1` + `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY=<segredo longo>`.
2. **Não** definir `GITLAB_TOKEN`, `GITLAB_MOCK`, `GITLAB_TLS_INSECURE_DEV` nem vars SmartTask (viewer só lê snapshot local).
3. Volume persistente em `data/` (`triage.db` + `gitlab-description-uploaded-assets-v1/`). O markdown exportado do editor deve apontar para assets já espelhados; copie a pasta de assets junto com o JSON se for outra máquina.
4. Fluxo: editar no editor local → **Atualizar** cards (espelha imagens em `data/`) → **Exportar** JSON **v2** (inclui imagens em base64) → no viewer, **Importar** com a chave (grava quadro + arquivos em `data/`). JSON v1 antigo não traz imagens — na VPS ficam quebradas porque o proxy GitLab está bloqueado.
5. Reverse proxy: HTTPS; recomenda-se rate limit e/ou IP allowlist no `PUT` `/api/wish-kanban-board/persisted-v1`.
6. Smoke: flags com `viewOnlyMode: true`; `POST /api/gitlab/issues/resolve` → 403; import com Bearer correto → 200; descrição/imagens ok.

## Limitações atuais

- **Sem login** de usuário no app: um quadro `default` por instalação. No viewer, o write do quadro fica atrás da API key de importação; GET do board e assets espelhados continuam públicos na rede do servidor.
- Certificados TLS internos / CA customizada são, em geral, **configuração de ambiente** (ex.: `NODE_EXTRA_CA_CERTS`), não regra de negócio do app.
- Faça **backup** de `data/triage.db`, `data/gitlab-description-uploaded-assets-v1/` e/ou export JSON do quadro antes de atualizações grandes.

## Docker (VPS)

Imagem multi-stage (`Dockerfile`): Node **22.14**, build com toolchain para `better-sqlite3`, runtime só com deps de produção.

```powershell
# Build
docker build -t tinadosdesejos:latest .

# Rodar (volume data/ + env de produção)
docker run --rm -p 3000:3000 `
  -v ${PWD}/data:/app/data `
  --env-file .env.production `
  tinadosdesejos:latest
```

Viewer com Compose: [`docker-compose.production-viewer-vps.yml`](docker-compose.production-viewer-vps.yml) — crie `.env.production` (`WISH_VIEW_ONLY_MODE=1` + `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY=...`, sem `GITLAB_TOKEN`), depois:

```powershell
docker compose -f docker-compose.production-viewer-vps.yml up -d --build
```

O SQLite e as imagens espelhadas ficam em `./data` no host (não vão na imagem).

## Scripts úteis

- `npm run dev`: desenvolvimento.
- `npm run build`: build de produção.
- `npm run test`: testes unitários (Vitest).
- `npm run ensure:sqlite`: recompila `better-sqlite3` para o Node ativo (use Node **22** neste repo).
- `npm run smoke`: smoke rápido (Vitest).
- `npm run smoke:full`: sobe `next dev`, testa `GET/PUT` das APIs de persistência com **HTTP 200 + JSON `ok: true`** (o que o browser usa). Usa **`data/smoke-triage.db` isolado** — não altera seu `data/triage.db` do dev.

`npm run dev` e `npm run build` rodam `ensure:sqlite` automaticamente (`predev` / `prebuild`).

**Se o quadro não carregar:** pare o servidor, rode `npm run ensure:sqlite`, depois `npm run dev` de novo. Não use um `npm run dev` antigo em outra porta sem as rotas novas.
