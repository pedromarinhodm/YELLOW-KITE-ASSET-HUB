# Requisitos Refinados de Desenvolvimento

Projeto: Yellow Kite Asset Hub  
Versao: 1.0  

## 1. Objetivo do Documento

Consolidar requisitos funcionais e nao funcionais do sistema para orientar desenvolvimento, testes, validacao e evolucao do produto.

## 2. Visao do Produto

Sistema web interno para gestao de equipamentos de TI, colaboradores e movimentacoes de entrega/devolucao (onboarding/offboarding), com rastreabilidade de historico e formalizacao por termo.

## 3. Escopo

### 3.1 Escopo Incluido

1. Cadastro e manutencao de equipamentos.
2. Cadastro e manutencao de colaboradores.
3. Controle de alocacoes ativas e historicas.
4. Fluxo de onboarding (entrega de equipamento).
5. Fluxo de offboarding (devolucao de equipamento).
6. Geracao de termos (texto).
7. Dashboard com indicadores operacionais.
8. Exportacao de dados (CSV/XLSX).

### 3.2 Escopo Excluido (nesta fase)

1. Controle financeiro avancado (depreciacao, centro de custo detalhado).
2. Assinatura eletronica.
3. Envio de termo por email.

## 4. Stakeholders

1. RH/People: opera onboarding/offboarding.
2. TI/Operacoes: administra inventario e disponibilidade.
3. Gestao: acompanha indicadores e conformidade.
4. Colaboradores: usuarios vinculados aos termos.

## 5. Requisitos Funcionais

### RF-01 - Autenticacao de ambiente (backend)
O backend deve iniciar apenas com variaveis criticas de conexao configuradas.

Critérios de aceite:
1. Sem `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`, a API nao sobe.
2. Com variaveis validas, endpoint de health retorna status `ok`.

### RF-02 - Health-check
O sistema deve disponibilizar endpoint de saude para monitoramento da API e banco.

Critérios de aceite:
1. `GET /api/health` retorna `status`, `service`, `database`, `timestamp`.
2. Em falha de banco, retorna erro padronizado.

### RF-03 - Cadastro de colaboradores
Permitir criar colaborador com dados obrigatorios.

Critérios de aceite:
1. Campos obrigatorios: `name`, `role`, `email`, `department`.
2. Status padrao do colaborador: `Ativo`.
3. E-mail deve ser unico no banco.

### RF-04 - Consulta de colaboradores
Permitir listar colaboradores ativos por padrao e incluir inativos sob demanda.

Critérios de aceite:
1. `GET /api/employees` retorna apenas `Ativo` por padrao.
2. `GET /api/employees?includeInactive=true` inclui todos.
3. Ordenacao por nome ascendente.

### RF-05 - Atualizacao de colaborador
Permitir atualizar parcialmente campos permitidos do colaborador.

Critérios de aceite:
1. Campos permitidos: `name`, `role`, `email`, `department`, `status`.
2. Colaborador inexistente retorna 404.

### RF-06 - Desligamento logico
Permitir marcar colaborador como desligado sem perder historico.

Critérios de aceite:
1. Operacao de desligamento altera `status` para `Desligado`.
2. Historico de alocacoes permanece consultavel.

### RF-07 - Cadastro de equipamentos
Permitir criar equipamento com dados patrimoniais completos.

Critérios de aceite:
1. Campos obrigatorios: `name`, `category`, `classification`, `serial_number`, `purchase_value`, `purchase_date`.
2. Status inicial: `available`.
3. Numero de serie deve ser unico.

### RF-08 - Consulta e filtros de equipamentos
Permitir listagem com filtros por status, classificacao e categoria.

Critérios de aceite:
1. `GET /api/equipments` retorna todos ordenados por nome.
2. Filtros combinaveis: `status`, `classification`, `category`.

### RF-09 - Atualizacao e exclusao de equipamentos
Permitir manutencao completa do cadastro de equipamentos.

Critérios de aceite:
1. Atualizacao parcial por `PATCH /api/equipments/:id`.
2. Exclusao por `DELETE /api/equipments/:id`.

### RF-10 - Alocacao em lote (onboarding)
Permitir alocar um ou mais equipamentos para um colaborador em uma unica operacao.

Critérios de aceite:
1. Requer `employee_id` e ao menos um equipamento (`equipment_id` ou `equipment_ids[]`).
2. Cria 1 registro de alocacao por equipamento.
3. Atualiza status dos equipamentos para `allocated`.
4. Suporta `return_deadline` para alocacoes avulsas.

### RF-11 - Devolucao de alocacao (offboarding)
Permitir devolver equipamento e definir destino pos-retorno.

Critérios de aceite:
1. `PATCH /api/allocations/:id/return` registra `returned_at`.
2. Atualiza tipo da movimentacao para `offboarding`.
3. Atualiza status do equipamento para `available` ou `maintenance`.

### RF-12 - Consulta de alocacoes com detalhes
Permitir listagem de alocacoes com dados vinculados de colaborador e equipamento.

Critérios de aceite:
1. `GET /api/allocations` retorna joins (`employees`, `equipments`).
2. Filtro `activeOnly=true` retorna apenas nao devolvidas.
3. Filtro `employeeId` retorna alocacoes do colaborador.

### RF-13 - Dashboard operacional
Exibir indicadores de inventario e pessoas para decisao rapida.

Critérios de aceite:
1. Total de equipamentos e valor total.
2. Quantitativos por status (`available`, `allocated`, `maintenance`).
3. Total de colaboradores ativos.
4. Lista de ultimas alocacoes.
5. Lista de pendencias por prazo vencido (quando houver `return_deadline`).

### RF-14 - Termos de responsabilidade/devolucao
Gerar texto de termo no frontend para entrega e devolucao.

Critérios de aceite:
1. Termo inclui dados de colaborador, equipamentos e valor total.
2. Termo pode ser copiado pela interface.

### RF-15 - Exportacao de relatorios
Permitir exportar dados de inventario e alocacoes.

Critérios de aceite:
1. Exportacao em `.xlsx` e `.csv`.
2. Campos exportados devem ser legiveis para area operacional.

## 6. Regras de Negocio

1. Equipamento alocado nao pode ser tratado como disponivel.
2. Devolucao define explicitamente o destino: estoque (`available`) ou manutencao (`maintenance`).
3. Colaborador desligado nao deve aparecer em selecoes de ativos por padrao.
4. Movimentacao avulsa pode ter prazo de devolucao (`return_deadline`).
5. Setup de mesa e externas sao classificacoes distintas para operacao e filtros.
6. Integridade entre tabelas deve respeitar FKs (`allocations` -> `employees` e `equipments`).

## 7. Requisitos Nao Funcionais

### RNF-01 - Performance
1. Listagens principais devem responder em tempo adequado para uso operacional (meta: ate 2s em ambiente interno padrao).
2. Operacoes em lote (alocacao multipla) devem manter consistencia sem degradacao perceptivel.

### RNF-02 - Confiabilidade e consistencia
1. Erros de API devem retornar payload padronizado (`error`, `message`).
2. Operacoes de alocacao/devolucao devem manter status de equipamento consistente com o estado da alocacao.

### RNF-03 - Seguranca
1. Chaves de servico nao devem ser expostas no frontend.
2. Variaveis sensiveis devem ser carregadas via `.env`/secrets.

### RNF-04 - Observabilidade
1. API deve registrar requests em ambiente de desenvolvimento.
2. Erros devem ser logados no backend para diagnostico.

### RNF-05 - Manutenibilidade
1. Separacao por camadas: `routes`, `services`, `config`, `components`, `services` frontend.
2. Tipagem centralizada de dominio no frontend.
3. Documentacao atualizada sempre que houver alteracao estrutural relevante.

### RNF-06 - Compatibilidade
1. Frontend deve operar em navegadores modernos usados internamente.
2. Backend deve suportar Node.js 20+.

## 8. Modelo de Dados (Resumo)

### Entidades principais

1. `employees`
- `id`, `name`, `role`, `email`, `department`, `status`, `created_at`, `updated_at`

2. `equipments`
- `id`, `name`, `category`, `classification`, `serial_number`, `purchase_value`, `purchase_date`, `status`, `image_url`, `created_at`, `updated_at`

3. `allocations`
- `id`, `employee_id`, `equipment_id`, `allocated_at`, `returned_at`, `notes`, `type`, `term_signed`, `term_signed_at`, `return_deadline`, `created_at`

## 9. Requisitos de API (Contrato Minimo)

1. `GET /api/health`
2. `GET/POST/PATCH/DELETE /api/employees`
3. `GET /api/employees/departments`
4. `GET/POST/PATCH/DELETE /api/equipments`
5. `GET/POST /api/allocations`
6. `PATCH /api/allocations/:id/return`

## 10. Requisitos de Frontend

1. Rotas ativas:
- `/dashboard`
- `/inventory`
- `/employees`
- `/allocations`

2. Estados de UX obrigatorios:
- carregamento (spinner/skeleton)
- sucesso (toast)
- erro (toast/mensagem)
- vazio (empty state)

3. Navegacao:
- sidebar fixa no layout principal
- redirecionamento de `/` para `/dashboard`

## 11. Requisitos de Banco e Infra

1. Migrations devem ser versionadas em `supabase/migrations`.
2. RLS deve estar habilitado conforme estrategia definida para ambiente interno.

## 12. Critérios de Aceite da Release

1. CRUD de colaboradores e equipamentos funcionando de ponta a ponta.
2. Onboarding altera status de equipamentos para `allocated`.
3. Offboarding registra devolucao e aplica destino correto do equipamento.
4. Dashboard carrega indicadores sem erro.
5. Exportacao CSV/XLSX funcional nas telas de inventario e alocacoes.
6. README e este documento alinhados com implementacao atual.

## 13. Testes Recomendados

### 13.1 Backend
1. Teste de health-check.
2. Testes de validacao de payload em `POST`/`PATCH`.
3. Testes de integracao dos fluxos de alocacao/devolucao.

### 13.2 Frontend
1. Renderizacao das paginas principais.
2. Fluxos criticos (onboarding/offboarding).
3. Tratamento de erro de API e feedback visual.

### 13.3 Manual
1. Criar colaborador.
2. Criar equipamento.
3. Alocar equipamento.
4. Devolver equipamento com destino `maintenance`.
5. Exportar relatorio.

## 14. Definicao de Pronto (Definition of Done)

1. Requisito implementado e validado contra criterios de aceite.
2. Sem erros bloqueantes em fluxo principal.
3. Logs de erro tratados adequadamente.
4. Documentacao atualizada (`README.md` e `requisitos.md` quando aplicavel).
5. Codigo revisado e padrao de projeto mantido.

## 15. Pendencias/Evolucao (Backlog Tecnico)

1. Cobertura de testes automatizados para backend.
2. Cobertura de testes de interface para fluxos criticos.
3. Hardening de seguranca (politicas RLS por perfil e autenticacao de usuarios).
4. Registro de auditoria detalhado de alteracoes sensiveis.
5. Pipeline CI com lint, testes e validacoes de build.


