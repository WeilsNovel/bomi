# bomi Monorepo 构建编排（D008 架构）
# 用法：make <target>

.PHONY: help proto proto-lint build-server run-server build-mobile test clean install-deps

help: ## 显示所有命令
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ===== proto 契约（单一来源 → 多语言 codegen）=====
proto: ## 生成 Go/Kotlin/TS 代码（需安装 buf）
	@echo ">> 生成 proto 代码..."
	@cd proto && buf generate
	@echo ">> proto 代码生成完成"

proto-lint: ## proto 规范检查
	@cd proto && buf lint

# ===== 服务端（Go）=====
install-deps: ## 安装各端依赖
	@echo ">> Go mod tidy..."
	@cd server && go mod tidy
	@echo ">> pnpm install..."
	@pnpm install

build-server: ## 编译服务端
	@cd server && go build ./...

run-server: ## 启动服务端（需先 cp .env.example .env）
	@cd server && go run ./cmd/main.go

# ===== 移动端共享（KMP）=====
build-mobile: ## 编译 mobile-shared KMP 模块
	@cd mobile-shared && ./gradlew build

# ===== 测试 =====
test: ## 运行所有测试
	@echo ">> Go 测试..."
	@cd server && go test ./... || true
	@echo ">> KMP 测试..."
	@cd mobile-shared && ./gradlew allTests || true

# ===== 清理 =====
clean: ## 清理所有构建产物
	@echo ">> 清理 Go..."
	@cd server && go clean || true
	@echo ">> 清理 KMP..."
	@cd mobile-shared && ./gradlew clean || true
	@echo ">> 清理 pnpm..."
	@pnpm -r exec rimraf dist .turbo || true
	@echo ">> 清理 proto 产物..."
	@rm -rf gen/ server/internal/gen/ mobile-shared/src/commonMain/kotlin/com/bomi/shared/gen/
