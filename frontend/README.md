teste de commit

# Yellow Kite - Sistema de Gestão de Equipamentos

Sistema web interno para gerenciamento de equipamentos de TI, substituindo controle por planilhas com rastreabilidade, controle de custos e formalização de entrada/saída de equipamentos.

## 🎯 Objetivo

MVP de sistema de gestão de equipamentos para a agência Yellow Kite, atendendo 47 colaboradores. Interface web responsiva com visual limpo, minimalista e profissional. Usuário principal: RH.

## 🛠️ Stack Tecnológico

- **React** + **Vite** - Framework e bundler
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de UI
- **React Router** - Navegação
- **TanStack Query** - Gerenciamento de estado assíncrono

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx          # Sidebar de navegação
│   │   └── MainLayout.tsx          # Layout principal com sidebar
│   ├── ui/                         # Componentes shadcn/ui
│   ├── EmployeeCombobox.tsx        # Combobox com busca textual de colaboradores
│   ├── EmployeeDetailDialog.tsx    # Dialog de detalhes do colaborador
│   ├── NavLink.tsx                 # Links de navegação
│   ├── OnboardingModal.tsx         # Modal de onboarding (entrega)
│   ├── OffboardingModal.tsx        # Modal de offboarding (devolução)
│   ├── CategoryIcon.tsx            # Ícones por categoria
│   └── StatusBadge.tsx             # Badges de status
├── hooks/
│   ├── use-mobile.tsx              # Hook para detecção mobile
│   └── use-toast.ts                # Hook para notificações
├── mock/
│   └── db.ts                       # Dados mock para desenvolvimento
├── pages/
│   ├── Allocations.tsx             # Página de alocações (onboarding/offboarding)
│   ├── Dashboard.tsx               # Página inicial com métricas
│   ├── Employees.tsx               # Gestão de colaboradores
│   ├── Index.tsx                    # Landing page
│   ├── Inventory.tsx               # Inventário de equipamentos
│   └── NotFound.tsx                # Página 404
├── services/
│   ├── allocationService.ts        # Serviço de alocações, termos e histórico
│   ├── employeeService.ts          # Serviço de colaboradores
│   └── equipmentService.ts         # Serviço de equipamentos
├── types/
│   └── index.ts                    # Tipos TypeScript
├── App.tsx                         # Componente raiz com rotas
├── index.css                       # Design system e tokens
└── main.tsx                        # Entry point
```

## 📦 Módulos

### 1. Dashboard
- Total de ativos e valor investido
- Distribuição por status (Disponível, Alocado, Manutenção)
- Visão geral rápida com métricas

### 2. Inventário
- CRUD completo de equipamentos
- Categorias: Notebook, Monitor, Teclado, Mouse, Headset, Webcam, Outro
- Status: Disponível, Alocado, Manutenção
- Campos: Nome, Categoria, Número de Série, Valor, Data de Compra
- Filtros por categoria e status

### 3. Colaboradores
- CRUD completo de funcionários
- Departamentos: Criação, Performance, Audio Visual, Rocket, Lead Zeppelin, Engenharia de Soluções, Growth e Tecnologia, Financeiro, RH
- Campos: Nome, Cargo, Email, Departamento
- Filtros por departamento e busca

### 4. Alocações

#### Onboarding (Entrega de Equipamentos)
- Busca de colaborador por nome (combobox com digitação)
- Seleção múltipla de equipamentos com status "Disponível"
- Campo de estado de entrega individual por item (ex: "Notebook com detalhe na carcaça")
- Seletor de data de alocação (padrão: data atual)
- Geração de **Termo de Responsabilidade** com lista de IDs e descrições dos ativos
- Ação automática: status dos itens alterado de "Disponível" para "Alocado"

#### Offboarding (Devolução de Equipamentos)
- Busca de colaborador por nome (combobox com digitação)
- Listagem automática dos equipamentos sob posse do colaborador
- Checklist de devolução (confirmação de recebimento físico por item)
- Campo de estado de devolução individual (condições do equipamento)
- Destino pós-devolução: "Disponível" (estoque) ou "Manutenção"
- Seletor de data de recebimento (padrão: data atual)
- Geração de **Termo de Devolução** com estado de cada item
- Ação automática: vínculo do colaborador limpo e entrada no histórico gerada

#### Histórico
- Registro completo de todas as movimentações (entregas e devoluções)

## 🎨 Design System

Identidade visual Yellow Kite:
- **Fundo principal**: Branco/claro (#ffffff, #f9f9f9)
- **Cor de destaque**: Amarelo (#edab26)
- **Design**: Minimalista e limpo
- **Tipografia**: Texto escuro sobre fundos claros

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📋 Próximos Passos

- [ ] Integração com Lovable Cloud para persistência de dados
- [ ] Autenticação de usuários (RH)
- [ ] Upload de imagens de equipamentos
- [ ] Relatórios e exportação de dados (PDF)
- [ ] Notificações de manutenção

## 📄 Licença

Projeto interno Yellow Kite - Todos os direitos reservados.
