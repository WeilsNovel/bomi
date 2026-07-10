package handler

import (
	"github.com/WeilsNovel/bomi/server/internal/middleware"
	"github.com/gin-gonic/gin"
)

// HealthHandler 健康检查 handler
type HealthHandler struct{}

// NewHealthHandler 构造
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health 健康检查端点 GET /health
// 返回服务存活状态，供 LB / K8s 探活使用。
func (h *HealthHandler) Health(c *gin.Context) {
	middleware.OK(c, gin.H{
		"status":  "up",
		"service": "bomi-server",
	})
}

// Ping 极简 ping 端点 GET /ping
func (h *HealthHandler) Ping(c *gin.Context) {
	middleware.OK(c, gin.H{"pong": true})
}
