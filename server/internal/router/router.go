package router

import (
	"github.com/WeilsNovel/bomi/server/internal/config"
	"github.com/WeilsNovel/bomi/server/internal/handler"
	"github.com/WeilsNovel/bomi/server/internal/middleware"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Setup 初始化 Gin 路由
// 全局中间件顺序：Recovery > TraceID > AccessLog > CORS
// 路由分组：/health（公开）/ /api/v1（业务，部分需 JWT）
func Setup(cfg *config.Config, logger *zap.Logger) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()
	// 全局中间件
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.TraceID())
	r.Use(middleware.AccessLog(logger))
	r.Use(CORS())

	// 公开端点
	healthH := handler.NewHealthHandler()
	r.GET("/health", healthH.Health)
	r.GET("/ping", healthH.Ping)

	// 业务路由分组（Stage 1 仅注册分组骨架，具体 handler 后续按 proto 逐个接入）
	v1 := r.Group("/api/v1")
	{
		// 公开子分组（无需鉴权）
		pub := v1.Group("")
		{
			// auth := pub.Group("/auth")
			// {
			//   auth.POST("/wx-login", ...)
			//   auth.POST("/phone-login", ...)
			//   auth.POST("/apple-login", ...)
			//   auth.POST("/send-sms", ...)
			// }
			_ = pub
		}

		// 需鉴权子分组
		authed := v1.Group("")
		authed.Use(middleware.JWTAuth(cfg.JWT.Secret))
		{
			// authed.GET("/user/profile", ...)
			// 食物识别（AI）
			// authed.POST("/ai/food/recognize", ...)     // 传 image_key 调 VLM 识别
			// authed.POST("/ai/food/delete-image", ...)   // 用户确认打卡后删除 COS 临时图
			// 健康计划生成（AI）
			// authed.POST("/ai/plan/generate", ...)       // 传健康档案+近期营养汇总
			// authed.POST("/ai/chat", ...)
			// 注：饮食打卡明细完全本地化（D011），后端不提供 diet 接口
			_ = authed
		}

		// 管理后台子分组（需鉴权 + 管理员权限，Stage 2 接入）
		admin := v1.Group("/admin")
		admin.Use(middleware.JWTAuth(cfg.JWT.Secret))
		{
			_ = admin
		}
	}

	logger.Info("路由初始化完成", zap.Int("routes", len(r.Routes())))
	return r
}

// CORS 跨域中间件（开发期宽松，生产按需收紧白名单）
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Trace-Id")
		c.Header("Access-Control-Expose-Headers", "X-Trace-Id")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
