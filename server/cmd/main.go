package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/config"
	"github.com/WeilsNovel/bomi/server/internal/router"
	"go.uber.org/zap"
)

func main() {
	// 初始化配置
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("加载配置失败: %v", err))
	}

	// 初始化日志
	var logger *zap.Logger
	if cfg.Server.Mode == "debug" {
		logger, _ = zap.NewDevelopment()
	} else {
		logger, _ = zap.NewProduction()
	}
	defer logger.Sync()
	zap.ReplaceGlobals(logger)

	logger.Info("bomi 服务端启动中", zap.String("mode", cfg.Server.Mode))

	// 初始化数据库（Stage 1 仅骨架，后续接入）
	// db, err := database.Init(cfg.DB)
	// if err != nil {
	// 	logger.Fatal("数据库初始化失败", zap.Error(err))
	// }

	// 初始化路由
	engine := router.Setup(cfg, logger)

	// 启动 HTTP 服务
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      engine,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	go func() {
		logger.Info("HTTP 服务监听", zap.String("port", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("服务启动失败", zap.Error(err))
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("正在关闭服务...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("服务关闭失败", zap.Error(err))
	}
	logger.Info("服务已停止")
}
