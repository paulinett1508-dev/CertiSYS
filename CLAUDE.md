# CertiSYS — Sistema de Gestao de Certidoes Negativas

## Visao Geral
Sistema web fullstack para gestao e monitoramento de Certidoes Negativas (CNDs).
Dashboard moderno com sidebar, controle de acesso por perfil e upload de documentos.

Perfis: Admin (controle total) · Contador/Usuario (CRUD dos seus clientes) · Visualizador (leitura)

Stack: React 18 + TypeScript + shadcn/ui + Tailwind (cliente) | Express + Drizzle ORM + PostgreSQL Neon (servidor) | Google Cloud Storage (docs) | Replit Auth (OpenID)
Deploy: Replit
Submodulo: .agnostic-core/  (instalar via: git submodule add https://github.com/paulinett1508-dev/agnostic-core .agnostic-core)

---

## Estrutura Critica

```
client/src/
  pages/          # certificates, clients, home, reports, notifications, users
  components/     # app-sidebar, certificate-filters, status-badge, object-uploader
  hooks/          # useAuth (papel do usuario), use-toast
  lib/            # authUtils, dateUtils, queryClient
server/
  routes.ts       # API REST endpoints
  db.ts           # conexao Neon + Drizzle
  replitAuth.ts   # autenticacao OpenID
  audit.ts        # trilha de auditoria
  reports.ts      # geracao de relatorios
  objectStorage.ts # Google Cloud Storage
```

---

## Design System

- **Fonte:** Inter (Google Fonts)
- **Layout:** Sidebar fixa 256px + main flex-1 max-w-7xl
- **Cores primarias:** Azul Governo/Tecnologia (ver `attached_assets/Pasted-1-Paleta...`)
- **Componentes:** shadcn/ui (new-york style) + Tailwind
- Consultar `design_guidelines.md` antes de criar qualquer componente visual

---

## Antes de implementar

Backend:
  REST API design:    .agnostic-core/skills/backend/rest-api-design.md
  Error handling:     .agnostic-core/skills/backend/error-handling.md
  Seguranca de API:   .agnostic-core/skills/security/api-hardening.md
  OWASP checklist:    .agnostic-core/skills/security/owasp-checklist.md
  Banco de dados:     .agnostic-core/skills/database/query-compliance.md
  Schema design:      .agnostic-core/skills/database/schema-design.md
  Express patterns:   .agnostic-core/skills/nodejs/express-best-practices.md

Frontend:
  HTML e CSS:          .agnostic-core/skills/frontend/html-css-audit.md
  Acessibilidade:      .agnostic-core/skills/frontend/accessibility.md
  UX Guidelines:       .agnostic-core/skills/frontend/ux-guidelines.md
  Tailwind:            .agnostic-core/skills/frontend/tailwind-patterns.md

Qualidade:
  Testes:              .agnostic-core/skills/testing/unit-testing.md
  Performance:         .agnostic-core/skills/performance/performance-audit.md
  Debugging:           .agnostic-core/skills/audit/systematic-debugging.md
  Fact checking:       .agnostic-core/skills/ai/fact-checker.md

Operacional:
  Commits:             .agnostic-core/skills/git/commit-conventions.md
  Deploy procedures:   .agnostic-core/skills/devops/deploy-procedures.md
  Pre-deploy:          .agnostic-core/skills/devops/pre-deploy-checklist.md

---

## Agents disponiveis

  Security Reviewer:   .agnostic-core/agents/reviewers/security-reviewer.md
  Code Inspector:      .agnostic-core/agents/reviewers/code-inspector.md
  Frontend Reviewer:   .agnostic-core/agents/reviewers/frontend-reviewer.md
  Migration Validator: .agnostic-core/agents/validators/migration-validator.md
  Codebase Mapper:     .agnostic-core/agents/reviewers/codebase-mapper.md
  Database Architect:  .agnostic-core/agents/specialists/database-architect.md

---

## Regras Criticas

- **Controle de acesso:** SEMPRE validar perfil do usuario antes de operacoes de escrita/delete
- **Trilha de auditoria:** toda acao sensivel (criar/editar/excluir certidao) deve passar por `server/audit.ts`
- **Documentos:** uploads apenas via `server/objectStorage.ts` (Google Cloud) — nunca salvar arquivo no disco do servidor
- **Drizzle migrations:** usar `db:push` apenas em dev; em prod usar migration files via `db:generate`

---

## Uso de Subagents

- Use subagents para analise de schema Drizzle, revisao de endpoints e auditoria de seguranca em paralelo
- Offload verificacao de permissoes por perfil e analise de queries PostgreSQL para subagents
- Para novas funcionalidades com impacto em ACL: subagent de security review antes de implementar
- Referenciar: `.agnostic-core/agents/reviewers/security-reviewer.md` em mudancas de autenticacao/permissao

## Verificacao antes de Concluir

- Nunca marque tarefa como concluida sem `tsc --noEmit` passando e teste manual do fluxo afetado no Replit
- Checagem: permissoes por perfil funcionando, trilha de auditoria registrando, documentos subindo no GCS
- Pergunta padrao: *"Um auditor externo encontraria falha de acesso nessa mudanca?"*
- Consultar `.agnostic-core/skills/security/api-hardening.md` em qualquer mudanca de rota autenticada

## Elegancia (features nao-triviais)

- Para mudancas que tocam schema + rotas + frontend: pause e avalie impacto em permissoes e auditoria
- Se um endpoint esta fazendo mais de 1 coisa (query + logica de negocio): separar em service
- **Excecao:** ajustes de UI pontuais e fixes de tipagem — nao refatorar alem do escopo pedido
