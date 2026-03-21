.DEFAULT_GOAL := help
COMPOSE := docker compose -f services/knowledge-engine/docker-compose.yml

# ── Help ────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  setup              Install deps, copy .env templates"
	@echo "  dev                Start full stack (Next.js + Convex + Neo4j + Graphiti)"
	@echo "  dev-app            Start only Next.js + Convex"
	@echo "  dev-knowledge      Start Neo4j + Graphiti (Docker)"
	@echo "  stop-knowledge     Stop Neo4j + Graphiti"
	@echo "  status             Check stack health"
	@echo "  clean-knowledge    Remove Neo4j data volume"
	@echo ""
	@echo "Build:"
	@echo "  build              Build all packages"
	@echo "  lint               Lint all packages"
	@echo "  typecheck          Type-check all packages"
	@echo ""
	@echo "Deploy:"
	@echo "  deploy-convex      Deploy Convex backend"
	@echo "  deploy-knowledge   Deploy Graphiti to Fly.io"
	@echo "  deploy             Deploy everything"

# ── Development ─────────────────────────────────────────────────────

.PHONY: setup dev dev-app dev-knowledge stop-knowledge status clean-knowledge

setup:
	pnpm install
	@[ -f .env ] || cp .env.example .env
	@[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local
	@[ -f services/knowledge-engine/.env ] || cp services/knowledge-engine/.env.example services/knowledge-engine/.env
	@echo ""
	@echo "Setup done. Edit .env files with your API keys:"
	@echo "  .env                              (OPENAI_API_KEY, CONVEX_DEPLOY_KEY)"
	@echo "  apps/web/.env.local               (WorkOS keys)"
	@echo "  services/knowledge-engine/.env     (NEO4J_PASSWORD)"

dev: dev-knowledge dev-app

dev-app:
	pnpm dev

dev-knowledge:
	$(COMPOSE) up -d
	@printf "Waiting for Neo4j..."
	@until curl -sf http://localhost:7474 > /dev/null 2>&1; do printf "."; sleep 1; done
	@echo " OK"
	@printf "Waiting for Graphiti..."
	@until curl -sf http://localhost:8000/healthcheck > /dev/null 2>&1; do printf "."; sleep 1; done
	@echo " OK"
	@echo ""
	@echo "Knowledge engine ready:"
	@echo "  Neo4j Browser  http://localhost:7474"
	@echo "  Graphiti API   http://localhost:8000"

stop-knowledge:
	$(COMPOSE) down

status:
	@echo "=== Docker ==="
	@$(COMPOSE) ps 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "=== Neo4j ==="
	@curl -sf http://localhost:7474 > /dev/null 2>&1 \
		&& echo "  OK  http://localhost:7474" \
		|| echo "  DOWN"
	@echo ""
	@echo "=== Graphiti ==="
	@curl -sf http://localhost:8000/healthcheck > /dev/null 2>&1 \
		&& echo "  OK  http://localhost:8000" \
		|| echo "  DOWN"

clean-knowledge:
	$(COMPOSE) down -v
	@echo "Neo4j data volume removed."

# ── Build ───────────────────────────────────────────────────────────

.PHONY: build lint typecheck

build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm typecheck

# ── Deploy ──────────────────────────────────────────────────────────

.PHONY: deploy deploy-convex deploy-knowledge

deploy-convex:
	npx convex deploy

deploy-knowledge:
	cd services/knowledge-engine && ./deploy.sh

deploy: deploy-convex deploy-knowledge
	@echo ""
	@echo "Convex deployed. Vercel deploys via webhook on main push."
