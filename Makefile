# ============================================================
# Inno Agent — Docker Build & Push
# ============================================================

REGISTRY_URL       ?= crpi-a4e25wq5oddt3z3b.cn-shanghai.personal.cr.aliyuncs.com
REGISTRY_NAMESPACE ?= educlaw
REGISTRY_USER      ?= 13854793771
REGISTRY_PASS      ?= 54educlaw
IMAGE_WEB          ?= inno-agent-web
IMAGE_AUTH         ?= inno-agent-auth
VERSION            := $(shell git describe --exact-match --tags HEAD 2>/dev/null || git rev-parse --short HEAD)
PLATFORM           ?= linux/amd64

FULL_IMAGE_WEB     := $(REGISTRY_URL)/$(REGISTRY_NAMESPACE)/$(IMAGE_WEB)
FULL_IMAGE_AUTH    := $(REGISTRY_URL)/$(REGISTRY_NAMESPACE)/$(IMAGE_AUTH)

# ---- Colors ----
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

# ============================================================
# Local Development
# ============================================================

.PHONY: dev
dev: ## Start frontend + backend locally
	pnpm dev:all

.PHONY: build
build: ## Build frontend for production
	pnpm --filter inno-agent-frontend build

.PHONY: lint
lint: ## Run TypeScript type-check
	pnpm --filter inno-agent-frontend lint

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf inno-agent-frontend/dist
	rm -rf auth-backend/dist

# ============================================================
# Docker
# ============================================================

.PHONY: login
login: ## Login to Alibaba Cloud Container Registry
	@echo -e "$(GREEN)Logging in to $(REGISTRY_URL)...$(NC)"
	@echo "$(REGISTRY_PASS)" | docker login --username=$(REGISTRY_USER) --password-stdin $(REGISTRY_URL)

.PHONY: docker-build
docker-build: ## Build all Docker images (linux/amd64)
	docker buildx build --platform $(PLATFORM) -f inno-agent-frontend/Dockerfile -t inno-agent-web:latest --load .
	docker buildx build --platform $(PLATFORM) -f auth-backend/Dockerfile -t inno-agent-auth:latest --load .

.PHONY: docker-push
docker-push: login ## Push images to registry
	@echo -e "$(GREEN)Pushing frontend image...$(NC)"
	docker push $(FULL_IMAGE_WEB):latest
	@echo -e "$(GREEN)Pushing backend image...$(NC)"
	docker push $(FULL_IMAGE_AUTH):latest

.PHONY: docker-run
docker-run: docker-build ## Run with docker compose
	docker compose up

.PHONY: docker-compose-up
docker-compose-up: ## Start with docker-compose
	docker-compose up --build -d

.PHONY: docker-compose-down
docker-compose-down: ## Stop docker-compose
	docker-compose down

# ============================================================
# Zitadel Setup
# ============================================================

.PHONY: setup-zitadel
setup-zitadel: ## Auto-create Zitadel project & OIDC app via Management API
	@docker run --rm \
		--network inno-agent_internal-net \
		-v inno-agent_zitadel-bootstrap:/zitadel/bootstrap:ro \
		node:20-alpine /bin/sh -c ' \
		apk add --no-cache curl jq > /dev/null 2>&1; \
		ZITADEL_URL="http://zitadel:8080"; \
		PAT=$$(cat /zitadel/bootstrap/admin.pat | tr -d "[:space:]"); \
		echo "⏳ 等待 Zitadel 启动..."; \
		until curl -sf "$$ZITADEL_URL/debug/ready" > /dev/null 2>&1; do sleep 2; done; \
		echo "✅ Zitadel 已就绪"; \
		echo ""; \
		echo "📦 创建项目: Inno Agent"; \
		PROJECT_RESP=$$(curl -sf -X POST "$$ZITADEL_URL/management/v1/projects" \
			-H "Authorization: Bearer $$PAT" \
			-H "Content-Type: application/json" \
			-H "Host: inno.localhost" \
			-d "{\"name\":\"Inno Agent\"}"); \
		PROJECT_ID=$$(echo "$$PROJECT_RESP" | jq -r ".id // empty"); \
		if [ -z "$$PROJECT_ID" ]; then echo "❌ 创建项目失败"; echo "$$PROJECT_RESP" | jq .; exit 1; fi; \
		echo "✅ 项目 ID: $$PROJECT_ID"; \
		echo ""; \
		echo "🔑 创建 OIDC 应用"; \
		APP_RESP=$$(curl -sf -X POST "$$ZITADEL_URL/management/v1/projects/$$PROJECT_ID/apps/oidc" \
			-H "Authorization: Bearer $$PAT" \
			-H "Content-Type: application/json" \
			-H "Host: inno.localhost" \
			-d "{\"name\":\"inno-agent-backend\",\"redirectUris\":[\"http://auth-service:3000/auth/callback\"],\"postLogoutRedirectUris\":[\"http://localhost:3001\"],\"responseTypes\":[\"OIDC_RESPONSE_TYPE_CODE\"],\"grantTypes\":[\"OIDC_GRANT_TYPE_AUTHORIZATION_CODE\"],\"appType\":\"OIDC_APP_TYPE_WEB\",\"authMethodType\":\"OIDC_AUTH_METHOD_TYPE_NONE\"}"); \
		CLIENT_ID=$$(echo "$$APP_RESP" | jq -r ".clientId // empty"); \
		if [ -z "$$CLIENT_ID" ]; then echo "❌ 创建应用失败"; echo "$$APP_RESP" | jq .; exit 1; fi; \
		echo "✅ Client ID: $$CLIENT_ID"; \
		echo ""; \
		echo "══════════════════════════════════════════════════════"; \
		echo "  ZITADEL_PROJECT_ID  = $$PROJECT_ID"; \
		echo "  ZITADEL_CLIENT_ID   = $$CLIENT_ID"; \
		echo "══════════════════════════════════════════════════════"'

# ============================================================
# Help
# ============================================================

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
