# Yellow Kite - Sistema de Gestão de Equipamentos

Sistema web interno para gerenciamento de equipamentos de TI, substituindo controle por planilhas com rastreabilidade, controle de custos e formalização de entrada/saída de equipamentos.

## 🎯 Objetivo

MVP de sistema de gestão de equipamentos para a agência Yellow Kite, atendendo 47 colaboradores. Interface web responsiva com visual limpo, minimalista e profissional.

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
│   │   ├── AppSidebar.tsx      # Sidebar de navegação
│   │   └── MainLayout.tsx      # Layout principal com sidebar
│   ├── ui/                     # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── CategoryIcon.tsx        # Ícones por categoria
│   ├── NavLink.tsx             # Links de navegação
│   └── StatusBadge.tsx         # Badges de status
├── hooks/
│   ├── use-mobile.tsx          # Hook para detecção mobile
│   └── use-toast.ts            # Hook para notificações
├── integrations/
│   └── supabase/
│       └── placeholder.ts      # Placeholder para integração futura
├── lib/
│   └── utils.ts                # Utilitários (cn, etc)
├── mock/
│   └── db.ts                   # Dados mock para desenvolvimento
├── pages/
│   ├── Allocations.tsx         # Página de alocações
│   ├── Dashboard.tsx           # Página inicial com métricas
│   ├── Employees.tsx           # Gestão de colaboradores
│   ├── Index.tsx               # Landing page
│   ├── Inventory.tsx           # Inventário de equipamentos
│   └── NotFound.tsx            # Página 404
├── services/
│   ├── allocationService.ts    # Serviço de alocações
│   ├── employeeService.ts      # Serviço de colaboradores
│   └── equipmentService.ts     # Serviço de equipamentos
├── types/
│   └── index.ts                # Tipos TypeScript
├── App.tsx                     # Componente raiz com rotas
├── App.css                     # Estilos globais
├── index.css                   # Design system e tokens
└── main.tsx                    # Entry point
```

## 📦 Módulos

### 1. Dashboard
- Total de ativos
- Valor total investido
- Distribuição por status (Disponível, Alocado, Manutenção)
- Visão geral rápida

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
- Fluxo de Onboarding (entrega de equipamentos)
- Fluxo de Offboarding (devolução)
- Histórico de movimentações
- Geração de Termo de Responsabilidade

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

- [ ] Integração com Lovable Cloud (Supabase) para persistência
- [ ] Autenticação de usuários (RH)
- [ ] Upload de imagens de equipamentos
- [ ] Relatórios e exportação de dados
- [ ] Notificações de manutenção

## 📄 Licença

Projeto interno Yellow Kite - Todos os direitos reservados.
