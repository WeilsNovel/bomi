package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// TraceID 链路追踪中间件
// 优先透传客户端 X-Trace-Id，未带则生成 uuid，写入 context + 响应头 + 日志。
func TraceID() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-Id")
		if traceID == "" {
			traceID = uuid.NewString()
		}
		c.Set("traceId", traceID)
		c.Header("X-Trace-Id", traceID)
		c.Next()
	}
}

// AccessLog 访问日志中间件
// 记录 method/path/status/耗时/traceId，供排查问题。
func AccessLog(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Int("size", c.Writer.Size()),
			zap.Duration("cost", time.Since(start)),
			zap.String("traceId", c.GetString("traceId")),
			zap.String("ip", c.ClientIP()),
		)
	}
}
