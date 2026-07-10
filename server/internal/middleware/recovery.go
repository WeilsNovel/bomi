package middleware

import (
	"net/http"
	"runtime/debug"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/constants"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Recovery panic 恢复中间件
// 捕获 handler panic，记录堆栈，返回 50001 服务端错误，避免进程崩溃。
func Recovery(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("panic 捕获",
					zap.Any("error", r),
					zap.String("traceId", c.GetString("traceId")),
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.ByteString("stack", debug.Stack()),
				)
				c.AbortWithStatusJSON(http.StatusInternalServerError, BaseApiResponse{
					Code:      constants.ServerError,
					Message:   constants.GetMessage(constants.ServerError),
					TraceID:   c.GetString("traceId"),
					Timestamp: time.Now().UnixMilli(),
				})
			}
		}()
		c.Next()
	}
}
