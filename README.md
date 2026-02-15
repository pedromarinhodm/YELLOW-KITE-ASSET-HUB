# Yellow Kite Asset Hub

Sistema interno para gestao de equipamentos, colaboradores e ciclos de onboarding/offboarding, com frontend React, API Node.js/Express e banco Supabase.

## Visao Geral de Arquitetura

### Camadas do sistema

1. Frontend (`frontend/`)
- Interface web (React + Vite + TypeScript).
- Implementa telas de Dashboard, Inventario, Colaboradores e Alocacoes.
- Consome a API backend via `fetch` encapsulado em services.
- Chama Supabase Edge Function para envio de termos por e-mail.

2. Backend (`backend/`)
- API REST (Node.js + Express).
- Valida entradas, organiza rotas por dominio e delega regras para services.
- Faz leitura/escrita no Supabase com `service_role`.

3. Banco e funcoes (`supabase/`)
- Migrations SQL para schema e evolucao de tabelas.
- Edge Function (`send-term-email`) para envio SMTP.

### Fluxo principal de dados

1. Usuario interage no frontend.
2. Frontend chama services (`employeeService`, `equipmentService`, `allocationService`).
3. Services usam `apiClient` e fazem requests para o backend (`/api/*`).
4. Backend processa a requisicao (rotas -> services).
5. Services backend persistem/consultam dados no Supabase.
6. Resposta volta ao frontend para renderizacao da UI.

### Fluxo de termos (onboarding/offboarding)

1. Frontend gera texto do termo em `allocationService`.
2. Frontend monta `TermEmailPayload` em `webhookService`.
3. Chama `supabase.functions.invoke('send-term-email')`.
4. Edge Function em `supabase/functions/send-term-email/index.ts` envia e-mail SMTP.

## Estrutura do Projeto

```text
.
|-- backend/
|-- frontend/
|-- supabase/
|-- .gitignore
|-- INICIAR.BAT
`-- README.md
```

## Inventario de Arquivos (Funcao de Cada Arquivo)

### Raiz

- `.gitignore`: ignora artefatos locais/build (`node_modules`, `dist`, `.env`, logs etc.).
- `INICIAR.BAT`: script Windows que sobe backend e frontend em janelas separadas e abre o navegador.
- `README.md`: documentacao principal.

### Backend (`backend/`)

#### Arquivos de projeto

- `backend/package.json`: dependencias, scripts (`dev`, `start`, `migrate:lovable`, `import:csv`) e metadata do backend.
- `backend/package-lock.json`: lockfile do npm para reproducibilidade de instalacao.
- `backend/README.md`: guia local de setup, endpoints e scripts de migracao/importacao.

#### Entrada e bootstrap

- `backend/src/server.js`: ponto de entrada; inicia servidor HTTP na porta configurada.
- `backend/src/app.js`: monta app Express, middlewares globais e registro de rotas.

#### Configuracao

- `backend/src/config/env.js`: carrega e valida variaveis de ambiente obrigatorias.
- `backend/src/config/supabase.js`: instancia cliente admin do Supabase (`service_role`).

#### Middlewares

- `backend/src/middlewares/error-handler.js`: handler padrao para 404 e erros internos.

#### Rotas

- `backend/src/routes/system-routes.js`: endpoint de health-check (`GET /api/health`).
- `backend/src/routes/employees-routes.js`: CRUD e listagem de departamentos de colaboradores.
- `backend/src/routes/equipments-routes.js`: CRUD e filtros de equipamentos.
- `backend/src/routes/allocations-routes.js`: listagem, alocacao em lote e devolucao de alocacoes.

#### Camada de servicos

- `backend/src/services/employees-service.js`: regras de consulta e persistencia para `employees`.
- `backend/src/services/equipments-service.js`: regras de consulta e persistencia para `equipments`.
- `backend/src/services/allocations-service.js`: regras de alocacao/devolucao e sincronizacao de status de equipamentos.

#### Scripts operacionais

- `backend/scripts/migrate-lovable-cloud.js`: migra dados entre projetos Supabase (origem Lovable -> destino), com opcao de limpeza.
- `backend/scripts/import-csv-to-supabase.js`: importa CSVs (employees/equipments/allocations) para Supabase com upsert em lotes.

### Frontend (`frontend/`)

#### Arquivos de projeto e build

- `frontend/package.json`: scripts e dependencias do frontend (Vite, React, Tailwind, Radix, Vitest etc.).
- `frontend/package-lock.json`: lockfile npm do frontend.
- `frontend/bun.lockb`: lockfile Bun (quando ambiente usa Bun).
- `frontend/README.md`: documentacao local historica do frontend.
- `frontend/index.html`: shell HTML da SPA e metadados iniciais.
- `frontend/vite.config.ts`: config do Vite (porta 8080, alias `@`, plugin React SWC).
- `frontend/vitest.config.ts`: config de testes (jsdom, setup, includes).
- `frontend/eslint.config.js`: regras de lint TypeScript/React.
- `frontend/postcss.config.js`: pipeline PostCSS (Tailwind + Autoprefixer).
- `frontend/tailwind.config.ts`: tokens, tema e animacoes do Tailwind.
- `frontend/components.json`: configuracao do ecossistema shadcn/ui.
- `frontend/tsconfig.json`: config raiz TS com referencias para app/node.
- `frontend/tsconfig.app.json`: config TS da aplicacao React.
- `frontend/tsconfig.node.json`: config TS para arquivos de tooling (Vite).

#### Assets publicos

- `frontend/public/favicon.ico`: icone da aplicacao no navegador.
- `frontend/public/placeholder.svg`: asset placeholder reutilizavel.
- `frontend/public/robots.txt`: diretivas basicas para crawlers.

#### Entrada e composicao principal

- `frontend/src/main.tsx`: bootstrap React (`createRoot`) e import global de CSS.
- `frontend/src/App.tsx`: providers globais, roteamento principal e composicao das paginas.
- `frontend/src/App.css`: estilos complementares (escopo do App).
- `frontend/src/index.css`: design tokens, estilos base e utilitarios globais de UI.
- `frontend/src/vite-env.d.ts`: tipos do ambiente Vite para TypeScript.

#### Paginas

- `frontend/src/pages/Index.tsx`: redireciona rota raiz para `/dashboard`.
- `frontend/src/pages/Dashboard.tsx`: metricas gerais, pendencias de devolucao e atalhos de onboarding/offboarding.
- `frontend/src/pages/Inventory.tsx`: gestao completa de equipamentos (CRUD, filtros, exportacao, manutencao).
- `frontend/src/pages/Employees.tsx`: gestao de colaboradores (CRUD, filtros, desligamento logico, acesso ao historico).
- `frontend/src/pages/Allocations.tsx`: fluxo completo de alocacao/devolucao, filtros avancados, termos e envio por e-mail.
- `frontend/src/pages/NotFound.tsx`: fallback para rotas inexistentes (404).

#### Layout e componentes de dominio

- `frontend/src/components/layout/MainLayout.tsx`: estrutura base de pagina autenticada com sidebar.
- `frontend/src/components/layout/AppSidebar.tsx`: menu lateral e navegacao principal.
- `frontend/src/components/NavLink.tsx`: wrapper de `react-router-dom` para classes ativa/pendente.
- `frontend/src/components/EmployeeCombobox.tsx`: seletor pesquisavel de colaboradores.
- `frontend/src/components/EmployeeDetailDialog.tsx`: dialog com alocacoes ativas/historicas por colaborador.
- `frontend/src/components/OnboardingModal.tsx`: fluxo modal de entrega de equipamentos e termo.
- `frontend/src/components/OffboardingModal.tsx`: fluxo modal de devolucao, destino pos-retorno e termo.

#### Servicos frontend

- `frontend/src/services/apiClient.ts`: cliente HTTP base (GET/POST/PATCH/DELETE) e tratamento padrao de erros.
- `frontend/src/services/employeeService.ts`: adaptacao e operacoes de colaboradores via API.
- `frontend/src/services/equipmentService.ts`: adaptacao e operacoes de equipamentos via API.
- `frontend/src/services/allocationService.ts`: operacoes de alocacao/devolucao e geracao textual de termos.
- `frontend/src/services/exportService.ts`: exportacao para `.xlsx` e `.csv`.
- `frontend/src/services/webhookService.ts`: envio de termos por e-mail via Supabase Edge Function.

#### Tipos, hooks e utilitarios

- `frontend/src/types/index.ts`: contratos de dominio (Equipment, Employee, Allocation), enums e labels.
- `frontend/src/hooks/use-mobile.tsx`: hook de deteccao de breakpoint mobile.
- `frontend/src/hooks/use-toast.ts`: hook legado de toast (compatibilidade).
- `frontend/src/lib/utils.ts`: helper `cn` para composicao de classes Tailwind.

#### Integracao Supabase no frontend

- `frontend/src/integrations/supabase/client.ts`: cliente Supabase browser-side com variaveis `VITE_SUPABASE_*`.
- `frontend/src/integrations/supabase/types.ts`: tipagem gerada do schema Supabase para TypeScript.

#### Testes

- `frontend/src/test/setup.ts`: setup global do ambiente de testes.
- `frontend/src/test/example.test.ts`: teste de exemplo/sanity-check.

#### Assets internos

- `frontend/src/assets/logo-pipa.png`: logo usado na sidebar e identidade visual.

#### Biblioteca UI (`frontend/src/components/ui/`)

- `frontend/src/components/ui/accordion.tsx`: componente de secoes expansiveis.
- `frontend/src/components/ui/alert.tsx`: bloco visual de alertas informativos.
- `frontend/src/components/ui/alert-dialog.tsx`: dialogo de confirmacao de acoes criticas.
- `frontend/src/components/ui/aspect-ratio.tsx`: wrapper para manter proporcao fixa de conteudo.
- `frontend/src/components/ui/avatar.tsx`: avatar com fallback.
- `frontend/src/components/ui/badge.tsx`: badges/etiquetas visuais.
- `frontend/src/components/ui/breadcrumb.tsx`: navegacao em trilha (breadcrumb).
- `frontend/src/components/ui/button.tsx`: botao base com variantes.
- `frontend/src/components/ui/calendar.tsx`: seletor/calendario de datas.
- `frontend/src/components/ui/card.tsx`: container padrao em formato de card.
- `frontend/src/components/ui/carousel.tsx`: carrossel de itens.
- `frontend/src/components/ui/CategoryIcon.tsx`: mapeia categoria de equipamento para icone semantico.
- `frontend/src/components/ui/chart.tsx`: wrappers utilitarios para graficos.
- `frontend/src/components/ui/checkbox.tsx`: checkbox customizado.
- `frontend/src/components/ui/collapsible.tsx`: container colapsavel.
- `frontend/src/components/ui/command.tsx`: paleta/lista de comandos pesquisavel.
- `frontend/src/components/ui/context-menu.tsx`: menu de contexto.
- `frontend/src/components/ui/dialog.tsx`: modal/dialogo base.
- `frontend/src/components/ui/drawer.tsx`: painel deslizante (drawer).
- `frontend/src/components/ui/dropdown-menu.tsx`: menu suspenso.
- `frontend/src/components/ui/form.tsx`: wrappers de formulario integrados a validacao.
- `frontend/src/components/ui/hover-card.tsx`: card exibido em hover.
- `frontend/src/components/ui/input.tsx`: campo de texto base.
- `frontend/src/components/ui/input-otp.tsx`: entrada segmentada para OTP/codigos.
- `frontend/src/components/ui/label.tsx`: label semantica de formulario.
- `frontend/src/components/ui/menubar.tsx`: barra de menu.
- `frontend/src/components/ui/navigation-menu.tsx`: menu de navegacao estruturado.
- `frontend/src/components/ui/pagination.tsx`: controles de paginacao.
- `frontend/src/components/ui/popover.tsx`: conteudo flutuante ancorado.
- `frontend/src/components/ui/progress.tsx`: barra de progresso.
- `frontend/src/components/ui/radio-group.tsx`: grupo de opcoes exclusivas.
- `frontend/src/components/ui/resizable.tsx`: paineis redimensionaveis.
- `frontend/src/components/ui/scroll-area.tsx`: area com scroll customizado.
- `frontend/src/components/ui/select.tsx`: select customizado.
- `frontend/src/components/ui/separator.tsx`: separador visual.
- `frontend/src/components/ui/sheet.tsx`: painel lateral tipo sheet.
- `frontend/src/components/ui/sidebar.tsx`: infraestrutura de sidebar responsiva (provider, trigger, contexto).
- `frontend/src/components/ui/skeleton.tsx`: placeholder de carregamento.
- `frontend/src/components/ui/slider.tsx`: slider de faixa de valores.
- `frontend/src/components/ui/sonner.tsx`: integracao visual do sistema de toasts `sonner`.
- `frontend/src/components/ui/StatusBadge.tsx`: badge semantico de status de equipamento.
- `frontend/src/components/ui/switch.tsx`: switch on/off.
- `frontend/src/components/ui/table.tsx`: elementos de tabela.
- `frontend/src/components/ui/tabs.tsx`: abas de navegacao de conteudo.
- `frontend/src/components/ui/textarea.tsx`: campo de texto multilinha.
- `frontend/src/components/ui/toast.tsx`: primitive de toast.
- `frontend/src/components/ui/toaster.tsx`: container/renderizador global de toasts.
- `frontend/src/components/ui/toggle.tsx`: toggle simples.
- `frontend/src/components/ui/toggle-group.tsx`: grupo de toggles.
- `frontend/src/components/ui/tooltip.tsx`: tooltip para ajuda contextual.
- `frontend/src/components/ui/use-toast.ts`: estado/reducer de toast (stack local).

### Supabase (`supabase/`)

- `supabase/config.toml`: configuracao do projeto Supabase CLI e funcoes (inclui `verify_jwt`).
- `supabase/functions/send-term-email/index.ts`: Edge Function Deno que recebe payload e envia termos via SMTP.
- `supabase/migrations/20260209174503_51ad32b8-1f94-4495-9323-36bc50ed882e.sql`: migration inicial (tabelas, FKs, RLS, policies, indices e triggers de `updated_at`).
- `supabase/migrations/20260211131632_e920f1f1-3152-4fba-8aeb-45b1807b7e7d.sql`: adiciona coluna `status` em `employees`.
- `supabase/migrations/20260212162548_9133ca51-4e11-49a4-b5fb-f0a112750c5e.sql`: adiciona coluna `return_deadline` em `allocations`.

## Contratos de API (Resumo)

### System
- `GET /api/health`: valida disponibilidade da API e conexao com banco.

### Employees
- `GET /api/employees?includeInactive=true|false`: lista colaboradores.
- `GET /api/employees/departments`: lista departamentos distintos.
- `GET /api/employees/:id`: busca colaborador por id.
- `POST /api/employees`: cria colaborador.
- `PATCH /api/employees/:id`: atualiza campos permitidos.
- `DELETE /api/employees/:id`: remove colaborador fisicamente.

### Equipments
- `GET /api/equipments?status=&classification=&category=`: lista com filtros.
- `GET /api/equipments/:id`: busca equipamento por id.
- `POST /api/equipments`: cria equipamento.
- `PATCH /api/equipments/:id`: atualiza equipamento.
- `DELETE /api/equipments/:id`: remove equipamento.

### Allocations
- `GET /api/allocations?activeOnly=true|false&employeeId=<id>`: lista alocacoes (com joins de colaborador/equipamento).
- `POST /api/allocations`: cria uma ou varias alocacoes e atualiza status dos equipamentos para `allocated`.
- `PATCH /api/allocations/:id/return`: registra devolucao e atualiza destino do equipamento (`available` ou `maintenance`).

## Variaveis de Ambiente

### Backend

Obrigatorias:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcionais:
- `PORT` (default `3001`)
- `NODE_ENV`

Para migracao Lovable:
- `SOURCE_SUPABASE_URL`
- `SOURCE_SUPABASE_ANON_KEY`
- `TARGET_SUPABASE_URL` (opcional)
- `TARGET_SUPABASE_SERVICE_ROLE_KEY` (opcional)

### Frontend

- `VITE_API_URL` (default `http://localhost:3001/api`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase Edge Function (secrets)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME` (opcional)

## Como Rodar

### Opcao 1 (Windows rapido)

Execute na raiz:

```bat
INICIAR.BAT
```

### Opcao 2 (manual)

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## URLs Padrao

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
