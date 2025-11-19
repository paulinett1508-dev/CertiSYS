# Sistema de Gestão e Monitoramento de Certidões Negativas

## Visão Geral
Sistema web profissional para gestão e monitoramento de certidões negativas com controle de validade, notificações automáticas de vencimento e sistema robusto de controle de acesso por perfis de usuário.

## Tecnologias
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js + Node.js
- **Banco de Dados**: PostgreSQL (Neon)
- **Autenticação**: Replit Auth com suporte a Google, GitHub, email/password
- **Armazenamento**: Replit Object Storage para PDFs das certidões
- **Estado**: React Query para gerenciamento de dados

## Funcionalidades Principais

### 1. Autenticação e Controle de Acesso
- Sistema de autenticação via Replit Auth
- Três perfis de usuário com permissões distintas:
  - **Administrador**: Controle total do sistema, gerencia usuários, perfis e todas as certidões
  - **Contador**: Pode inserir, editar e visualizar certidões dos seus clientes
  - **Visualizador**: Acesso somente leitura aos dados

### 2. Dashboard Central
- Cards de status com números destacados:
  - Total de Certidões
  - Certidões Válidas (verde)
  - Certidões Vencidas (vermelho)
  - Próximas ao Vencimento (amarelo/laranja)
- Lista de atividades recentes
- Alertas visuais coloridos para certidões próximas do vencimento

### 3. Gestão de Certidões
- Cadastro completo com informações:
  - Tipo de certidão
  - Cliente associado
  - Órgão emissor
  - Data de emissão
  - Data de validade
  - Upload de PDF da certidão
- Edição e visualização de certidões
- Filtros avançados por status, cliente e tipo
- Busca por texto
- Visualização em tabela com paginação

### 4. Sistema de Notificações
- Alertas automáticos para certidões próximas do vencimento
- Painel de notificações com indicadores visuais
- Agrupamento por data (Hoje, Ontem, Esta Semana)

### 5. Gerenciamento de Usuários (Admin)
- CRUD completo de usuários
- Atribuição e alteração de perfis
- Controle de status (ativo/inativo)
- Visualização de último acesso

### 6. Upload de Documentos
- Upload seguro de PDFs via Object Storage
- Preview e download de documentos
- Controle de acesso aos arquivos baseado em permissões

## Estrutura de Dados

### Users (Usuários)
- id, email, firstName, lastName, profileImageUrl
- role: 'admin' | 'accountant' | 'viewer'
- createdAt, updatedAt

### Clients (Clientes)
- id, name, document (CPF/CNPJ), email, phone
- createdAt, updatedAt

### Certificates (Certidões)
- id, type, clientId, issuingAuthority
- issueDate, expiryDate, documentUrl
- status: 'valid' | 'expiring_soon' | 'expired'
- createdBy (userId), createdAt, updatedAt

### Notifications (Notificações)
- id, userId, certificateId, message, type
- isRead, createdAt

## Regras de Negócio

### Cálculo de Status
- **Válida**: Data de validade > 30 dias no futuro
- **Próxima ao Vencimento**: Data de validade entre hoje e 30 dias
- **Vencida**: Data de validade no passado

### Controle de Acesso
- Administradores: acesso total
- Contadores: acesso apenas aos clientes criados por eles
- Visualizadores: acesso somente leitura

## Design System
- Baseado em design_guidelines.md
- Inspiração: Linear, Notion, ferramentas enterprise
- Cores: Sistema azul profissional (--primary: 217 91% 35%)
- Tipografia: Inter para clareza em interfaces data-intensive
- Componentes: Shadcn UI com Sidebar nativa
- Responsivo: Mobile-first com breakpoints lg/md

## Navegação
- **Dashboard** (`/`): Visão geral e estatísticas
- **Certidões** (`/certificates`): Listagem e gerenciamento
- **Notificações** (`/notifications`): Central de alertas
- **Usuários** (`/users`): Gerenciamento (admin only)
- **Configurações** (futuro): Preferências do usuário

## Funcionalidades Implementadas

### ✅ Concluído
- Sistema completo de autenticação e controle de acesso
- Dashboard com estatísticas em tempo real
- CRUD completo de certidões e clientes
- Upload seguro de PDFs (Object Storage)
- Sistema de notificações automáticas in-app
- Notificações automáticas por email (SendGrid)
- Logs de auditoria para ações administrativas
- Relatórios exportáveis (PDF/Excel) com filtros
- Filtros avançados com multi-select (tipos e status)
- Controle de permissões em todos os endpoints
- Interface responsiva e moderna (Shadcn UI)

### Características Técnicas
- Estatísticas calculadas dinamicamente do dataset filtrado
- Exportações respeitam filtros aplicados e permissões de usuário
- Scheduler para geração automática de notificações
- Emails HTML profissionais sem emojis
- Auditoria completa de ações administrativas

## Próximas Melhorias (Opcional)
- Autenticação multifator (MFA)
- Filtros por range de datas mais avançados
- Dashboards personalizáveis por usuário
- Webhooks para integrações externas
